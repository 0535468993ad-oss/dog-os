import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, EmptyState, ErrorState, FeedbackBanner, Screen, showToast, type Feedback } from '@/components/ui';
import type { TrainingTrack } from '@/features/training/types';

import { DogStep } from './components/DogStep';
import { OnboardingIntro } from './components/OnboardingIntro';
import { QuestionStep } from './components/QuestionStep';
import { ResultStep } from './components/ResultStep';
import { WizardProgress } from './components/WizardProgress';
import { useAssessmentWizard, useCompleteOnboarding } from './hooks/useOnboarding';
import type { OnboardingMode } from './types';
import { canAdvance, progressOf, questionStepFor } from './utils/wizard';

interface OnboardingScreenProps {
  mode: OnboardingMode;
  /** REASSESS: the dog to assess (validated against the owner's dogs). */
  dogId?: string | null;
}

/** The diagnostic onboarding: intro, dog, 11 questions in 4 steps, and the profile card with the owner's track choice. */
export function OnboardingScreen({ mode, dogId = null }: OnboardingScreenProps) {
  const wizard = useAssessmentWizard(mode, dogId);
  const finish = useCompleteOnboarding();
  const [track, setTrack] = useState<TrainingTrack | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<Feedback | null>(null);
  const { state, recommendation, dog } = wizard;
  const progress = progressOf(state, mode);
  const questions = questionStepFor(state.step);
  // While the dog is under the age floor the card shows (and saves) force-free, whatever was tapped before.
  const selected = recommendation?.gate === 'LOCKED' ? 'FORCE_FREE' : (track ?? recommendation?.track ?? 'FORCE_FREE');

  // Never a dead end: first run can always be skipped (the assessment stays in the training tab).
  const leave = () => {
    if (mode === 'FIRST_RUN') finish.complete();
    else if (router.canGoBack()) router.back();
    else router.replace('/training');
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await wizard.save(selected);
    setSaving(false);
    if (result === 'NOT_READY') return;
    if (result === 'SAVE_FAILED') {
      // Stay on the card: the answers are still here, and the owner can try again.
      setSaveError({ kind: 'error', text: 'לא הצלחנו לשמור את האבחון במכשיר. נסו שוב.' });
      return;
    }
    if (result === 'DOG_MISSING') {
      showToast('הכלב הזה כבר לא ברשימה. בחרו כלב ונמשיך.');
      if (mode === 'REASSESS') leave();
      return;
    }
    leave();
  };

  if (mode === 'REASSESS' && !wizard.dogsLoading && wizard.dogs.length === 0) {
    return (
      <Screen>
        <EmptyState icon="paw-outline" title="אין כלב לאבחון" body="הוסיפו כלב בלשונית הפרופיל, ואז נתחיל." action={<Button title="חזרה" onPress={leave} />} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        {progress.index > 1 ? <Button title="חזרה" icon="arrow-forward" variant="ghost" compact onPress={wizard.back} /> : <View />}
        <Button title={mode === 'FIRST_RUN' ? 'דלג בינתיים' : 'ביטול'} variant="ghost" compact loading={finish.isPending} onPress={leave} />
      </View>
      <WizardProgress index={progress.index} total={progress.total} />
      {state.step === 'INTRO' ? <OnboardingIntro /> : null}
      {state.step === 'DOG' ? <DogStep dogs={wizard.dogs} selectedId={state.assessedDogId} onPick={wizard.pickDog} onAddDog={() => router.push('/dogs/edit')} /> : null}
      {questions ? <QuestionStep step={questions} answers={state.answers} onAnswer={wizard.answer} /> : null}
      {state.step === 'RESULT' && wizard.gameError ? (
        <ErrorState message="לא הצלחנו לטעון את ההתקדמות של הכלב, ולכן עוד לא שמרנו. נסו שוב." onRetry={wizard.retryGame} />
      ) : null}
      {state.step === 'RESULT' && recommendation && dog ? (
        <ResultStep
          dogName={dog.name}
          recommendation={recommendation}
          selected={selected}
          onSelect={setTrack}
          saving={saving || finish.isPending}
          canSave={wizard.gameReady && !saving}
          onSave={() => void save()}
        />
      ) : null}
      {state.step === 'RESULT' ? <FeedbackBanner feedback={saveError} /> : null}
      {state.step !== 'RESULT' ? <Button title={state.step === 'INTRO' ? 'מתחילים' : 'המשך'} icon="arrow-back" onPress={wizard.next} disabled={!canAdvance(state)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
