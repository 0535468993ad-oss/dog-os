import { render, screen } from '@testing-library/react-native';

import { FeedbackBanner } from '../FeedbackBanner';

describe('FeedbackBanner', () => {
  it('renders nothing without feedback', async () => {
    await render(<FeedbackBanner feedback={null} />);
    expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
  });

  it.each(['error', 'info', 'success'] as const)('announces %s feedback as one alert', async (kind) => {
    await render(<FeedbackBanner feedback={{ kind, text: 'הודעה' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent('הודעה');
  });
});
