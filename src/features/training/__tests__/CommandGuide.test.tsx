// The command guide inside the modal: the marker words, handler mechanics on every step, troubleshooting
// ordered by the dog's nerve profile, and balanced escalations only on the open balanced track for a dog
// that is not sensitive. Renders the real curriculum.
import { render, screen } from '@testing-library/react-native';
import type { ComponentProps } from 'react';

import { CommandDetailModal } from '../components/CommandDetailModal';
import { TRAINING_COMMANDS } from '../data/commandsData';
import type { NerveProfile, TrainingTrack } from '../types';
import { recommendTraining } from '../utils/temperamentEngine';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

const ESCALATION_LABEL = 'במסלול המאוזן, רק להתנהגות שהכלב כבר מכיר:';
const sit = TRAINING_COMMANDS.find((command) => command.id === 'sit');

/** Opens "sit" for a dog with this nerve profile (null: no recommendation yet) on this track. */
async function openSit(nerve: NerveProfile | null, track: TrainingTrack = 'FORCE_FREE') {
  if (!sit) throw new Error('sit is missing');
  // A real engine recommendation; only the nerve profile, which the guide reads, is set by the test.
  const recommendation = nerve === null ? null : { ...recommendTraining({ trait: 'STEADY', ageMonths: 24, breedId: null }), nerve };
  const props: ComponentProps<typeof CommandDetailModal> = {
    command: sit,
    dog: { name: 'ג׳קסון', breedLabel: null, breedId: null, trait: null, recommendation },
    mode: 'STANDARD',
    stars: 0,
    onRep: jest.fn(),
    onStruggle: jest.fn(),
    track,
    access: 'GRANTED',
    pendingRisks: [],
    lockReasonHe: null,
    onClose: jest.fn(),
    onTrackChange: jest.fn(),
    onAcknowledgeBalanced: jest.fn(),
    onChecklistStep: jest.fn(),
    onCheckStep: jest.fn(),
    onComplete: jest.fn(),
  };
  const { QueryClient, QueryClientProvider } = jest.requireActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  await render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <CommandDetailModal {...props} />
    </QueryClientProvider>,
  );
}

describe('command guide', () => {
  it('shows the marker words, the handler mechanics of each step and the troubleshooting, with no escalation on force-free', async () => {
    await openSit(null);
    expect(screen.getByText('מרקר סיום: "כן!" – התגמול מגיע, אפשר לזוז')).toBeOnTheScreen();
    expect(screen.getByText('מרקר המשך: "טוב" – נשארים בתנוחה, התגמול מגיע אליו')).toBeOnTheScreen();
    expect(screen.getByText('שחרור: "חופשי" – התרגיל נגמר')).toBeOnTheScreen();
    expect(screen.getAllByText(/^ידיים, רצועה וגוף: /)).toHaveLength(4);
    // The duration step holds position, so it is marked "טוב", not the releasing "כן!".
    expect(screen.getByText('"טוב" – בסוף המשך, כשהכלב עדיין יושב')).toBeOnTheScreen();
    expect(screen.getByText('"כן!" – ברגע הישיבה אחרי המילה')).toBeOnTheScreen();
    expect(screen.getByText(/^לחיצה על הגב או על האגן/)).toBeOnTheScreen();
    expect(screen.queryByText(ESCALATION_LABEL)).toBeNull();
    expect(screen.queryByText(/רלוונטי במיוחד/)).toBeNull();
    expect(screen.queryByText(/פקודה מומלצת במיוחד/)).toBeNull();
  });

  it("lists a driven dog's tip first with a text badge, and names the command as a priority for its profile", async () => {
    await openSit('HARD_HIGH_DRIVE');
    expect(screen.getByText('רלוונטי במיוחד לג׳קסון')).toBeOnTheScreen();
    expect(screen.getByText('פקודה מומלצת במיוחד לג׳קסון – פרופיל קשוח ובעל דחף גבוה')).toBeOnTheScreen();
    const mistakes = screen.getAllByText(/^(חזרה על "שב|לחיצה על הגב|תגמול אחרי שהכלב)/).map((node) => String(node.props.children));
    expect(mistakes[0]).toMatch(/^חזרה על "שב/);
    expect(screen.queryByText(ESCALATION_LABEL)).toBeNull();
  });

  it('shows the escalation on the open balanced track for a driven dog', async () => {
    await openSit('HARD_HIGH_DRIVE', 'BALANCED');
    expect(screen.getByText(ESCALATION_LABEL)).toBeOnTheScreen();
    expect(screen.getByText(/^כשהכלב מכיר את "שב" ומתעלם/)).toBeOnTheScreen();
  });

  it('never shows an escalation for a sensitive dog, even on the open balanced track', async () => {
    await openSit('SENSITIVE_SOFT', 'BALANCED');
    expect(screen.getByText('רלוונטי במיוחד לג׳קסון')).toBeOnTheScreen();
    expect(screen.queryByText(ESCALATION_LABEL)).toBeNull();
    expect(screen.queryByText(/^כשהכלב מכיר את "שב" ומתעלם/)).toBeNull();
  });
});
