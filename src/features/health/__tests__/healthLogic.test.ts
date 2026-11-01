import AsyncStorage from '@react-native-async-storage/async-storage';

import { makeSymptom, makeVaccination, makeVetArticle } from '@/test/fixtures';

import { loadVetKnowledge } from '../api';

import { parseStoredKnowledge, STORED_KNOWLEDGE_VERSION, toStoredKnowledge } from '../logic/storedKnowledge';
import { NEARBY_EMERGENCY_VET_URL, normalizeVetPhone, telUrl } from '../logic/vetContact';

import { buildFoodInput, parseDecimal, parseMeals } from '../logic/foodForm';
import { MAX_MATCHES, MULTI_SIGN_THRESHOLD, triageSymptoms } from '../logic/symptomTriage';
import { vaccinationStatus } from '../logic/vaccinationStatus';
import { emergencyArticles, filterVetArticles, normalizeSearch, resultCountLabel } from '../logic/vetSearch';
import { parseWeightKg } from '../logic/weightInput';


const mockNetwork = { offline: false };
const mockTables: Record<string, unknown[]> = {
  veterinary_knowledge_base: [{ ...makeVetArticle(), actions: [{ title: 'נוסעים', body: 'מיד' }] }],
  vet_symptoms: [makeSymptom()],
  vet_symptom_conditions: [{ symptom_id: 'vomiting', article_id: 'bloat' }],
};
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (mockNetwork.offline) throw new Error('offline');
      const result = Promise.resolve({ data: mockTables[table] ?? [], error: null });
      const query = { order: () => result, then: result.then.bind(result) };
      return { select: () => query };
    },
  },
  unwrap: <T,>(response: { data: T; error: unknown }) => {
    if (response.error) throw response.error;
    return response.data;
  },
}));

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

  it('ignores letter case and extra spaces in the query', () => {
    expect(filterVetArticles(articles, { query: '  gdv ', category: 'all', breedId: null }).map((a) => a.id)).toEqual(['bloat']);
    expect(normalizeSearch('  GDV   בטן ')).toBe('gdv בטן');
  });

  it('words the result count in Hebrew', () => {
    expect([0, 1, 12].map(resultCountLabel)).toEqual(['אין ערכים', 'ערך אחד', '12 ערכים']);
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
    expect(triageSymptoms({ ...base, selectedIds: [] })).toEqual({ redFlagOptions: [], urgency: null, reason: null, matches: [] });
  });

  it('takes the most urgent selected symptom', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting', 'lethargy'] }).urgency).toBe('vet_visit');
  });

  it('escalates to emergency on any checked red flag', () => {
    expect(triageSymptoms({ ...base, selectedIds: ['vomiting'], checkedRedFlags: ['דם בהקאה'] })).toMatchObject({ urgency: 'emergency', reason: 'RED_FLAG' });
  });

  it(`raises ${MULTI_SIGN_THRESHOLD}+ home-care signs to a vet visit, but never one on its own`, () => {
    const itching = makeSymptom({ id: 'itching', base_urgency: 'home_care' });
    const input = { ...base, symptoms: [vomiting, itching] };
    expect(triageSymptoms({ ...input, selectedIds: ['vomiting'] })).toMatchObject({ urgency: 'home_care', reason: 'SYMPTOM' });
    expect(triageSymptoms({ ...input, selectedIds: ['vomiting', 'itching'] })).toMatchObject({ urgency: 'vet_visit', reason: 'MULTIPLE_SIGNS' });
  });

  it('never lowers an emergency symptom, whatever else is selected', () => {
    const breathing = makeSymptom({ id: 'breathing', base_urgency: 'emergency' });
    const itching = makeSymptom({ id: 'itching', base_urgency: 'home_care' });
    expect(triageSymptoms({ ...base, symptoms: [breathing, itching, vomiting], selectedIds: ['breathing', 'itching', 'vomiting'] })).toMatchObject({ urgency: 'emergency', reason: 'SYMPTOM' });
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

describe('vet contact', () => {
  it.each([
    ['03-1234567', '031234567'],
    [' 054 123 4567 ', '0541234567'],
    ['+972 (54) 123-4567', '+972541234567'],
  ])('normalizes %s', (input, phone) => {
    expect(normalizeVetPhone(input)).toBe(phone);
    expect(telUrl(phone)).toBe(`tel:${phone}`);
  });

  it.each([[''], ['12345'], ['abc-defg'], ['*2457'], ['1234567890123456']])('rejects %s', (input) => {
    expect(normalizeVetPhone(input)).toBeNull();
  });

  it('searches maps for an open emergency vet', () => {
    expect(NEARBY_EMERGENCY_VET_URL.startsWith('https://www.google.com/maps/search/?api=1&query=')).toBe(true);
    expect(decodeURIComponent(NEARBY_EMERGENCY_VET_URL)).toContain('וטרינר חירום 24 שעות');
  });
});

describe('stored knowledge (offline copy)', () => {
  const knowledge = {
    articles: [makeVetArticle({ actions: [{ title: 'נוסעים', body: 'מיד' }] })],
    symptoms: [makeSymptom()],
    conditionsBySymptom: new Map([['vomiting', ['bloat']]]),
  };
  const stored = () => JSON.parse(JSON.stringify(toStoredKnowledge(knowledge))) as Record<string, unknown>;

  it('round-trips through JSON and marks the result offline', () => {
    const parsed = parseStoredKnowledge(JSON.stringify(toStoredKnowledge(knowledge)));
    expect(parsed).toEqual({ ...knowledge, offline: true });
  });

  it.each([
    ['missing', null],
    ['not JSON', '{oops'],
    ['an old version', JSON.stringify({ ...stored(), v: STORED_KNOWLEDGE_VERSION + 1 })],
    ['no articles', JSON.stringify({ ...stored(), articles: [] })],
    ['an unknown category', JSON.stringify({ ...stored(), articles: [{ ...makeVetArticle(), category: 'constructor' }] })],
    ['a malformed action', JSON.stringify({ ...stored(), articles: [{ ...makeVetArticle(), actions: [{ title: 1 }] }] })],
    ['a bad urgency on a symptom', JSON.stringify({ ...stored(), symptoms: [{ ...makeSymptom(), base_urgency: 'later' }] })],
    ['a broken symptom map', JSON.stringify({ ...stored(), mapping: [['vomiting', 'bloat']] })],
  ])('rejects %s', (_, raw) => {
    expect(parseStoredKnowledge(raw)).toBeNull();
  });
});

describe('loadVetKnowledge', () => {
  beforeEach(async () => {
    mockNetwork.offline = false;
    await AsyncStorage.clear();
  });

  it('throws the network error when offline with no device copy', async () => {
    mockNetwork.offline = true;
    await expect(loadVetKnowledge()).rejects.toThrow('offline');
  });

  it('keeps a device copy of every successful load and serves it offline after a restart', async () => {
    const online = await loadVetKnowledge();
    expect(online.offline).toBeUndefined();
    await new Promise((resolve) => setTimeout(resolve, 0));

    mockNetwork.offline = true;
    const offline = await loadVetKnowledge();
    expect(offline.offline).toBe(true);
    expect(offline.articles.map((a) => a.id)).toEqual(['bloat']);
    expect(offline.articles[0]?.actions).toEqual([{ title: 'נוסעים', body: 'מיד' }]);
    expect(offline.conditionsBySymptom.get('vomiting')).toEqual(['bloat']);
  });
});

