import * as ImagePicker from 'expo-image-picker';

import { breedLabelOf, buildDogInput, suggestedSize, validateDogForm, type DogFormValues } from '../form/dogFormLogic';
import { pickDogPhoto } from '../form/pickDogPhoto';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));

const TODAY = '2026-10-18';
const values: DogFormValues = { name: ' רקסי ', breedId: 'labrador', customBreed: null, birthDate: '2022-05-10', size: 'large', weight: '28,5' };

describe('dog form logic', () => {
  it('builds the record to save', () => {
    expect(buildDogInput(values, TODAY)).toEqual({ name: 'רקסי', breed: 'לברדור רטריבר', breedId: 'labrador', birthDate: '2022-05-10', size: 'large', weightKg: 28.5 });
  });

  it('stores "mixed" as text only, and accepts a custom breed', () => {
    expect(buildDogInput({ ...values, breedId: 'mixed' }, TODAY)).toMatchObject({ breed: 'מעורב', breedId: null });
    expect(buildDogInput({ ...values, breedId: null, customBreed: 'כנעני-מיקס' }, TODAY)).toMatchObject({ breed: 'כנעני-מיקס', breedId: null });
  });

  it('treats an empty weight as unknown', () => {
    expect(buildDogInput({ ...values, weight: '' }, TODAY)?.weightKg).toBeNull();
  });

  it('reports every invalid field', () => {
    const errors = validateDogForm({ name: '', breedId: null, customBreed: null, birthDate: '2030-01-01', size: null, weight: '400' }, TODAY);
    expect(Object.keys(errors).sort()).toEqual(['birthDate', 'breed', 'name', 'size', 'weight']);
    expect(errors.birthDate).toMatch(/בעתיד/);
    expect(buildDogInput({ ...values, size: null }, TODAY)).toBeNull();
  });

  it('labels listed and custom breeds', () => {
    expect(breedLabelOf('labrador', null)).toBe('לברדור רטריבר');
    expect(breedLabelOf(null, 'כנעני-מיקס')).toBe('כנעני-מיקס');
    expect(breedLabelOf('not-a-breed', null)).toBeNull();
  });

  it("suggests the breed's size without overriding the user's choice", () => {
    expect(suggestedSize(null, 'labrador')).toBe('large');
    expect(suggestedSize('small', 'labrador')).toBe('small');
  });
});

describe('pickDogPhoto', () => {
  const launch = ImagePicker.launchImageLibraryAsync as jest.Mock;

  it('returns the picked photo', async () => {
    launch.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.jpg', base64: 'AAA', mimeType: 'image/jpeg' }] });
    await expect(pickDogPhoto()).resolves.toEqual({ status: 'picked', photo: { uri: 'file:///a.jpg', base64: 'AAA', mimeType: 'image/jpeg' } });
  });

  it('reports a cancelled pick', async () => {
    launch.mockResolvedValue({ canceled: true, assets: null });
    await expect(pickDogPhoto()).resolves.toEqual({ status: 'cancelled' });
  });

  // Regression: a picker failure (e.g. permission denied) was an unhandled rejection with no feedback.
  it('turns a picker failure into a result instead of throwing', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    launch.mockRejectedValue(new Error('permission denied'));
    await expect(pickDogPhoto()).resolves.toEqual({ status: 'failed' });
    expect(consoleError).toHaveBeenCalledWith('[dog-photo-picker]', expect.any(Error));
    consoleError.mockRestore();
  });
});
