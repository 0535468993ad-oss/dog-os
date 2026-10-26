// Characterization of the dog form hook: breed choice (size suggestion, custom breed), photo failures,
// submit (input, photo-failure toast, back, error) and delete.
import { act, renderHook } from '@testing-library/react-native';
import { router } from 'expo-router';

import { showToast } from '@/components/ui';
import { makeDog } from '@/test/fixtures';
import { todayIso } from '@/utils/date';

import { buildDogInput, MAX_CUSTOM_BREED_LENGTH, suggestedSize } from '../form/dogFormLogic';
import { pickDogPhoto } from '../form/pickDogPhoto';
import { useDogForm } from '../form/useDogForm';

const mockSave = jest.fn(async () => ({ photoFailed: false }));
const mockRemove = jest.fn(async () => undefined);

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));
jest.mock('@/components/ui', () => ({ ...jest.requireActual<object>('@/components/ui'), showToast: jest.fn() }));
jest.mock('../form/pickDogPhoto', () => ({ pickDogPhoto: jest.fn() }));
jest.mock('../hooks', () => ({
  useSaveDog: () => ({ mutateAsync: mockSave, isPending: false }),
  useDeleteDog: () => ({ mutateAsync: mockRemove, isPending: false }),
}));

describe('useDogForm', () => {
  beforeEach(() => jest.clearAllMocks());

  it('suggests a size for a listed breed, and truncates a custom breed', async () => {
    const { result } = await renderHook(() => useDogForm(undefined));
    await act(async () => result.current.chooseBreed('labrador'));
    expect(result.current.values).toMatchObject({ breedId: 'labrador', customBreed: null, size: suggestedSize(null, 'labrador') });
    await act(async () => result.current.chooseCustomBreed('x'.repeat(MAX_CUSTOM_BREED_LENGTH + 20)));
    expect(result.current.values.breedId).toBeNull();
    expect(result.current.values.customBreed).toHaveLength(MAX_CUSTOM_BREED_LENGTH);
  });

  it('reports a photo picker failure', async () => {
    jest.mocked(pickDogPhoto).mockResolvedValueOnce({ status: 'failed' } as never);
    const { result } = await renderHook(() => useDogForm(undefined));
    await act(() => result.current.choosePhoto());
    expect(showToast).toHaveBeenCalledWith('לא הצלחנו לפתוח את התמונות. בדקו את ההרשאה לגישה לתמונות בהגדרות המכשיר.');
  });

  it('submits the built input, toasts a failed photo, and goes back', async () => {
    mockSave.mockResolvedValueOnce({ photoFailed: true });
    const { result } = await renderHook(() => useDogForm(undefined));
    await act(async () => {
      result.current.setName('רקס');
      result.current.chooseBreed('labrador');
      result.current.setBirthDate('2024-01-01');
    });
    await act(() => result.current.submit());
    expect(mockSave).toHaveBeenCalledWith({ id: undefined, input: buildDogInput(result.current.values, todayIso()), photo: null });
    expect(showToast).toHaveBeenCalledWith('הכלב נשמר, אך העלאת התמונה נכשלה. אפשר לנסות שוב מעריכת הפרופיל.');
    expect(router.back).toHaveBeenCalled();
  });

  it('keeps the form with an error when saving fails, and refuses an invalid form', async () => {
    const { result } = await renderHook(() => useDogForm(undefined));
    await act(() => result.current.submit());
    expect(mockSave).not.toHaveBeenCalled();
    expect(Object.keys(result.current.errors).length).toBeGreaterThan(0);
    mockSave.mockRejectedValueOnce(new Error('boom'));
    await act(async () => {
      result.current.setName('רקס');
      result.current.chooseBreed('labrador');
      result.current.setBirthDate('2024-01-01');
    });
    await act(() => result.current.submit());
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(result.current.submitError).toBe('לא הצלחנו לשמור את הכלב. נסו שוב.');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('deletes an existing dog and goes back', async () => {
    const dog = makeDog();
    const { result } = await renderHook(() => useDogForm(dog));
    expect(result.current.values.name).toBe(dog.name);
    await act(() => result.current.deleteDog());
    expect(mockRemove).toHaveBeenCalledWith(dog);
    expect(router.back).toHaveBeenCalled();
  });
});
