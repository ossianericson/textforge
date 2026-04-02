import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

describe('OnboardingTour', () => {
  it('does not render when closed', () => {
    render(<OnboardingTour open={false} onFinish={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the first step when open', () => {
    render(<OnboardingTour open onFinish={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
  });

  it('advances to the next step', async () => {
    const user = userEvent.setup();
    render(<OnboardingTour open onFinish={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Next' }));

    expect(screen.getByRole('heading', { name: 'Toolbar overview' })).toBeInTheDocument();
  });

  it('skip calls onFinish from the first step', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<OnboardingTour open onFinish={onFinish} />);

    await user.click(screen.getByRole('button', { name: 'Skip' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('finish calls onFinish on the last step', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    render(<OnboardingTour open onFinish={onFinish} />);

    for (let index = 0; index < 6; index += 1) {
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }

    await user.click(screen.getByRole('button', { name: 'Finish' }));

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});