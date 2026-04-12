import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentEditor } from '@/components/document/DocumentEditor';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: (selector: (state: Record<string, any>) => unknown) => selector(editorStoreMock.state),
}));

vi.mock('@/lib/useAI', () => ({
  useAI: () => ({ customiseTemplate: vi.fn(), isLoading: false }),
}));

vi.mock('@tiptap/react', () => ({
  EditorContent: () => <div>Editor content</div>,
  useEditor: () => null,
}));

describe('DocumentEditor', () => {
  beforeEach(() => {
    editorStoreMock.state = {
      spec: null,
      currentPath: null,
      createNewSpec: vi.fn(),
      openFile: vi.fn(),
      toggleGenerateModal: vi.fn(),
      toggleRepoBrowser: vi.fn(),
      recentFiles: [],
      updateSpecFromDoc: vi.fn(),
      setEditorInstance: vi.fn(),
      showTemplateCustomizeBanner: false,
      dismissTemplateCustomizeBanner: vi.fn(),
      openFromGeneratedSpec: vi.fn(),
      pushToast: vi.fn(),
      isAiConfigured: true,
      setDirty: vi.fn(),
      addQuestion: vi.fn(),
      addResult: vi.fn(),
    };
  });

  it('offers a blank-spec entry point in the empty state', async () => {
    const user = userEvent.setup();

    render(<DocumentEditor />);

    expect(screen.getByTestId('document-empty-state')).toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('document-empty-state')).toHaveClass('min-h-0');

    await user.click(screen.getByRole('button', { name: 'Start blank spec' }));

    expect(editorStoreMock.state.createNewSpec).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Open existing spec.md' })).toBeInTheDocument();
  });
});