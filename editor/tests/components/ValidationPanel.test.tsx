import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidationPanel } from '@/components/panels/ValidationPanel';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

const SAMPLE_WARNINGS = [
  { code: 'W001', line: 12, message: 'Missing "I don\'t know" option on q2a', nodeId: 'q2a' },
  { code: 'W002', line: 34, message: 'Progress step for q3b may be out of range', nodeId: 'q3b' },
];

const SAMPLE_AI_ISSUES = [
  { type: 'suggestion', message: 'Consider adding a "Unsure" fallback to result-aks', nodeId: 'result-aks' },
];

describe('ValidationPanel', () => {
  beforeEach(() => {
    editorStoreMock.state = {
      validationWarnings: [],
      aiReviewIssues: [],
    };
  });

  it('renders the validation header and empty state', () => {
    render(<ValidationPanel />);

    expect(screen.getByText('Validation')).toBeInTheDocument();
    expect(screen.getByText('0 item(s)')).toBeInTheDocument();
    expect(screen.getByText('✓ No warnings')).toBeInTheDocument();
  });

  it('renders compiler warnings when present', () => {
    editorStoreMock.state = {
      ...editorStoreMock.state,
      validationWarnings: SAMPLE_WARNINGS,
    };

    render(<ValidationPanel />);

    expect(screen.getByText(/missing.*i don't know.*q2a/i)).toBeInTheDocument();
    expect(screen.getByText(/progress step.*q3b/i)).toBeInTheDocument();
    expect(screen.getByText('W001')).toBeInTheDocument();
    expect(screen.getByText('W002')).toBeInTheDocument();
  });

  it('renders AI review issues when present', () => {
    editorStoreMock.state = {
      ...editorStoreMock.state,
      aiReviewIssues: SAMPLE_AI_ISSUES,
    };

    render(<ValidationPanel />);

    expect(screen.getByText(/consider adding a.*unsure.*fallback/i)).toBeInTheDocument();
    expect(screen.getByText('✨ SUGGESTION')).toBeInTheDocument();
  });

  it('renders compiler warnings and AI issues together with the correct count', () => {
    editorStoreMock.state = {
      ...editorStoreMock.state,
      validationWarnings: SAMPLE_WARNINGS,
      aiReviewIssues: SAMPLE_AI_ISSUES,
    };

    render(<ValidationPanel />);

    expect(screen.getByText(/missing.*i don't know/i)).toBeInTheDocument();
    expect(screen.getByText(/consider adding a.*unsure.*fallback/i)).toBeInTheDocument();
    expect(screen.getByText('3 item(s)')).toBeInTheDocument();
  });

  it('dispatches a scroll event when clicking an item with a nodeId', async () => {
    const user = userEvent.setup();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');
    editorStoreMock.state = {
      ...editorStoreMock.state,
      validationWarnings: [SAMPLE_WARNINGS[0]],
    };

    render(<ValidationPanel />);

    await user.click(screen.getByRole('button', { name: /missing.*i don't know/i }));

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = dispatchSpy.mock.calls[0]?.[0];
    expect(event).toBeInstanceOf(CustomEvent);
    expect(event?.type).toBe('textforge:scroll-to-id');
    expect((event as CustomEvent<{ id: string }>).detail).toEqual({ id: 'q2a' });
  });
});