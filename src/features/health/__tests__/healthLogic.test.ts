import { makeSymptom, makeVaccination, makeVetArticle } from '@/test/fixtures';

import { buildFoodInput, parseDecimal, parseMeals } from '../logic/foodForm';
import { MAX_MATCHES, triageSymptoms } from '../logic/symptomTriage';
import { vaccinationStatus } from '../logic/vaccinationStatus';
import { emergencyArticles, filterVetArticles } from '../logic/vetSearch';
import { parseWeightKg } from '../logic/weightInput';

const TODAY = '2026-10-18';

describe('vaccinationStatus', () => {
  it.each([
    [null, 'neutral', 'ללא מועד הבא'],
    ['2026-10-10', 'danger', 'באיחור'],
    ['2026-10-18', 'warning', 'בקרוב (היום)'],
    ['2026-11-17', 'warning', 'בקרוב'],
    ['2026-12-01', 'success', 'הבא:'],
  ])('due %s -> %s', (due, tone, label) => {
    const status = vaccinationStatus(makeVaccination({ due_date: due }), TODAY);
    expect(status.tone).toBe(tone);
    expect(status.label).toContain(label);
  });
});

describe('parseWeightKg', () => {
  it.each([
    ['12.5', 12.5],
    ['12,5', 12.5],
    [' 30 ', 30],
  ])('accepts %s', (input, kg) => {
    expect(parseWeightKg(input)).toBe(kg);
  });

  it.each([[''], ['0'], ['-3'], ['150'], ['abc']])('rejects %s', (input) => {
    expect(parseWeightKg(input)).toBeNull();
  });
});

describe('filterVetArticles', () => {
  const articles = [
    makeVetArticle(),
    makeVetArticle({ id: 'otitis', category: 'condition', title: 'דלקת אוזניים', signs: ['גירוד'], breeds: [], tags: [] }),
  ];

  it('filters by category', () => {
    expect(filterVetArticles(articles, { query: '', category: 'condition', breedId: null }).map((a) => a.id)).toEqual(['otitis']);
  });

  it('filters by breed', () => {
    expect(filterVetArticles(articles, { query: '', category: 'all', breedId: 'german-shepherd' }).map((a) => a.id)).toEqual(['bloat']);
  });

  it('searches titles, signs and tags', () => {
    expect(filterVetArticles(articles, { query: 'גירוד', category: 'all', breedId: null }).map((a) => a.id)).toEqual(['otitis']);
    expect(filterVetArticles(articles, { query: 'GDV', category: 'all', breedId: null }).map((a) => a.id)).toEqual(['bloat']);
  });

  it('picks the emergency articles', () => {
    expect(emergencyArticles(articles).map((a) => a.id)).toEqual(['bloat']);
  });
});

describe('triageSymptoms', () => {
  const vomiting = makeSymptom({ id: 'vomiting', base_urgency: 'home_care', red_flags: ['דם בהקאה', 'בטן נפוחה'] });
  const lethargy = makeSymptom({ id: 'lethargy', base_urgency: 'vet_visit', red_flags: ['בטן נפוחה'] });
  const articles = [makeVetArticle({ id: 'a', sort_order: 2 }), makeVetArticle({ id: 'b', sort_order: 1 })];
  const conditionsBySymptom = new Map([
    ['vomiting', ['a', 'b']],
    ['lethargy', ['a']],
  ]);
  const base = { symptoms: [vomiting, lethargy], articles, conditionsBySymptom, checkedRedFlags: [] as string[] };

  it('has no verdict until a symptom is chosen', () => {
    expect(triageSymptoms({ ...base, selectedIds: [] })).toEqual({ redFlagOptions: [], urgency: null, matches: [] });
  });

  it('takes the most urgent selected symptom', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting', 'lethargy'] }).urgency).toBe('vet_visit');
  });

  it('escalates to emergency on any checked red flag', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting'], checkedRedFlags: ['דם בהקאה'] }).urgency).toBe('emergency');
  });

  it('ignores red flags that belong to symptoms no longer selected', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['lethargy'], checkedRedFlags: ['דם בהקאה'] }).urgency).toBe('vet_visit');
  });

  it('deduplicates red flags across symptoms', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting', 'lethargy'] }).redFlagOptions).toEqual(['דם בהקאה', 'בטן נפוחה']);
  });

  it('ranks articles by how many symptoms point to them, then by order', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting', 'lethargy'] }).matches.map((a) => a.id)).toEqual(['a', 'b']);
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting'] }).matches.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it(`returns at most ${MAX_MATCHES} matches`, () => {
    const many = Array.from({ length: 12 }, (_, i) => makeVetArticle({ id: `m${i}`, sort_order: i }));
    const result = triageSymptoms({ ...base, articles: many, conditionsBySymptom: new Map([['vomiting', many.map((a) => a.id)]]), selectedIds: ['vomiting'] });
    expect(result.matches).toHaveLength(MAX_MATCHES);
  });
});

describe('food form', () => {
  const values = { foodName: 'מזון יבש', kcal: '370', meals: '2', gramsOverride: '' };

  it('parses decimal commas and rounds meals', () => {
    expect(parseDecimal('3,5')).toBe(3.5);
    expect(Number.isNaN(parseDecimal(''))).toBe(true);
    expect(parseMeals('2.6')).toBe(3);
  });

  it("uses the calculator's portion when no manual grams are given", () => {
    expect(buildFoodInput(values, 123.456).input).toEqual({ foodName: 'מזון יבש', kcalPer100g: 370, gramsPerMeal: 123.5, mealsPerDay: 2, notes: null });
  });

  it('prefers the manual portion', () => {
    expect(buildFoodInput({ ...values, gramsOverride: '90' }, 123).input?.gramsPerMeal).toBe(90);
  });

  it('allows a plan without calories', () => {
    expect(buildFoodInput({ ...values, kcal: '', gramsOverride: '90' }, null).input?.kcalPer100g).toBeNull();
  });

  it('reports every invalid field', () => {
    const { input, errors } = buildFoodInput({ foodName: ' ', kcal: '', meals: '9', gramsOverride: '' }, null);
    expect(input).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(['foodName', 'grams', 'meals']);
  });
});
