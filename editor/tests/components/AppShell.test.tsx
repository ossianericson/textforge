import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const editorStoreMock = vi.hoisted(() => ({
  state: {} as Record<string, any>,
}));

const useEditorStoreMock = vi.hoisted(() =>
  Object.assign(
    (selector?: (state: Record<string, any>) => unknown) =>
      selector ? selector(editorStoreMock.state) : editorStoreMock.state,
    {
      getState: () => editorStoreMock.state,
    }
  )
);

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/store/useEditorStore', () => ({
  useEditorStore: useEditorStoreMock,
}));

vi.mock('@/components/toolbar/Toolbar', () => ({
  Toolbar: () => <div>Toolbar</div>,
}));

vi.mock('@/components/document/DocumentEditor', () => ({
  DocumentEditor: () => <div>Document editor</div>,
}));

vi.mock('@/components/sidebar/CanvasSidebar', () => ({
  CanvasSidebar: () => <div>Mermaid sidebar</div>,
}));

vi.mock('@/components/shared/EditorErrorBoundary', () => ({
  EditorErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/shared/Toast', () => ({
  Toast: () => null,
}));

vi.mock('@/components/ai/GenerateModal', () => ({ GenerateModal: () => null }));
vi.mock('@/components/onboarding/OnboardingTour', () => ({ OnboardingTour: () => null }));
vi.mock('@/components/dashboard/MyTreesDashboard', () => ({ MyTreesDashboard: () => null }));
vi.mock('@/components/repo/CommitModal', () => ({ CommitModal: () => null }));
vi.mock('@/components/repo/RepoBrowser', () => ({ RepoBrowser: () => null }));
vi.mock('@/components/shared/ShortcutsModal', () => ({ ShortcutsModal: () => null }));
vi.mock('@/components/settings/SettingsModal', () => ({ SettingsModal: () => null }));
vi.mock('@/components/panels/ProgressPanel', () => ({ ProgressPanel: () => null }));
vi.mock('@/components/panels/ValidationPanel', () => ({ ValidationPanel: () => null }));
vi.mock('@/components/toolbar/MermaidExportModal', () => ({ MermaidExportModal: () => null }));

import App from '@/App';

describe('App shell', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1180 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 740 });

    editorStoreMock.state = {
      showPreview: false,
      previewHtml: null,
      showValidationPanel: false,
      showProgressPanel: false,
      isDirty: false,
      currentPath: null,
      spec: {
        title: { main: 'Compact test tree', subtitle: '' },
        metadata: { version: '1.0.0' },
        questions: {},
        results: {},
        progressSteps: {},
      },
      validationWarnings: [],
      sidebarCollapsed: false,
      sidebarWidth: 420,
      showMermaidModal: false,
      showGenerateModal: false,
      showDashboard: false,
      showSettingsModal: false,
      showOnboardingTour: false,
      showShortcutsModal: false,
      showRepoBrowser: false,
      showCommitModal: false,
      saveFile: vi.fn(),
      saveFileAs: vi.fn(),
      openFile: vi.fn(),
      compile: vi.fn(),
      undo: vi.fn(),
      toggleValidationPanel: vi.fn(),
      toggleProgressPanel: vi.fn(),
      togglePreview: vi.fn(),
      toggleMermaidModal: vi.fn(),
      toggleGenerateModal: vi.fn(),
      toggleDashboard: vi.fn(),
      toggleOnboardingTour: vi.fn(),
      toggleShortcutsModal: vi.fn(),
      toggleRepoBrowser: vi.fn(),
      toggleCommitModal: vi.fn(),
      loadRecentFiles: vi.fn().mockResolvedValue(undefined),
      loadSavedRepoConnections: vi.fn().mockResolvedValue(undefined),
      loadEditorPrefs: vi.fn().mockResolvedValue(undefined),
      autoSaveEnabled: false,
      toasts: [],
      dismissToast: vi.fn(),
      setSidebarWidth: vi.fn(),
    };
  });

  it('uses adaptive workspace without enforcing a fixed minimum window height', () => {
    const { container } = render(<App />);

    expect(screen.getByText('Adaptive workspace')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('h-dvh');
    expect(container.firstChild).not.toHaveClass('min-h-[680px]');
  });
});