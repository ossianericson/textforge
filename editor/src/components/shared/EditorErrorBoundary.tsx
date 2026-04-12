import type { ReactNode } from 'react';
import { Component } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Props {
  currentPath?: string | null;
  name?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class EditorErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error): void {
    // The fallback UI is the recovery path here.
    this.setState({ error });
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const panelName = this.props.name ?? 'Editor panel';

    return (
      <div className="flex flex-1 items-center justify-center bg-slate-950 px-6 py-10">
        <div className="w-full max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <div className="mb-3 text-sm uppercase tracking-[0.18em] text-red-200">Editor recovery</div>
          <h2 className="mb-3 text-2xl font-semibold text-white">{panelName} hit an unexpected error.</h2>
          <p className="mb-6 text-sm leading-6 text-red-100">Your spec file is safe.</p>
          <div className="mb-6 rounded-xl border border-red-500/20 bg-black/20 px-4 py-3 text-left text-xs text-red-100">
            {this.state.error?.message ?? 'No error details available.'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Reset
            </button>
            <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white">Try to reload</button>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(this.state.error?.stack ?? 'No stack');
              }}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200"
            >
              Copy error
            </button>
            <button
              type="button"
              onClick={() => {
                if (this.props.currentPath) {
                  void invoke('open_path_in_file_manager', { path: this.props.currentPath });
                }
              }}
              disabled={!this.props.currentPath}
              className="rounded-md border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
            >
              Show in folder
            </button>
          </div>
        </div>
      </div>
    );
  }
}