import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EditorErrorBoundary } from '../../src/components/shared/EditorErrorBoundary';

function Broken() {
  throw new Error('test');
}

describe('EditorErrorBoundary', () => {
  it('renders children', () => {
    render(
      <EditorErrorBoundary name="T" currentPath={null}>
        <div>OK</div>
      </EditorErrorBoundary>
    );
    expect(screen.getByText('OK')).toBeTruthy();
  });

  it('shows panel name on crash', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <EditorErrorBoundary name="Graph view" currentPath={null}>
        <Broken />
      </EditorErrorBoundary>
    );
    expect(screen.getByText(/Graph view/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Reset/i })).toBeTruthy();
    spy.mockRestore();
  });
});