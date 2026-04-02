import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AIConfig } from '@shared/types';
import { clearConfig, getOrDiscoverConfig, setCachedConfig } from '@/lib/ai-config';
import { useIsMountedRef } from '@/lib/useIsMountedRef';
import { useAI } from '@/lib/useAI';
import { useEditorStore } from '@/store/useEditorStore';

export function SettingsModal() {
  const toggleSettingsModal = useEditorStore((state) => state.toggleSettingsModal);
  const analyticsEnabled = useEditorStore((state) => state.analyticsEnabled);
  const autoSaveEnabled = useEditorStore((state) => state.autoSaveEnabled);
  const setAnalytics = useEditorStore((state) => state.setAnalytics);
  const setAutoSave = useEditorStore((state) => state.setAutoSave);
  const pushToast = useEditorStore((state) => state.pushToast);
  const { checkAuth } = useAI();
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [manualEndpoint, setManualEndpoint] = useState('');
  const [manualDeployment, setManualDeployment] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authState, setAuthState] = useState<'neutral' | 'green' | 'amber' | 'red'>('neutral');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMountedRef = useIsMountedRef();

  useEffect(() => {
    void Promise.all([
      invoke<AIConfig | null>('load_ai_config'),
      invoke<string | null>('load_api_key'),
    ])
      .then(([savedConfig, key]) => {
        if (!isMountedRef.current) return;
        setConfig(savedConfig);
        setManualEndpoint(savedConfig?.endpoint ?? '');
        setManualDeployment(savedConfig?.deployment ?? '');
        setApiKey(key ?? '');
        setAuthState(savedConfig ? 'neutral' : key ? 'amber' : 'red');
      })
      .catch(() => {
        if (!isMountedRef.current) return;
        setAuthState('red');
      });

  }, []);

  const refreshAzureConfig = () => {
    setIsRefreshing(true);
    void Promise.all([getOrDiscoverConfig(), checkAuth()])
      .then(([result, aadReady]) => {
        if (!isMountedRef.current) return;
        setConfig(result.config);
        setManualEndpoint(result.config?.endpoint ?? '');
        setManualDeployment(result.config?.deployment ?? '');
        setAuthState(aadReady ? 'green' : apiKey ? 'amber' : result.config ? 'neutral' : 'red');
        pushToast(
          result.config
            ? 'AI configuration refreshed from Azure.'
            : 'No Azure OpenAI endpoint was auto-selected. Pick one during generation or use manual settings.',
          'info'
        );
      })
      .catch((caught) => {
        if (!isMountedRef.current) return;
        setAuthState(apiKey ? 'amber' : 'red');
        pushToast(caught instanceof Error ? caught.message : String(caught), 'error');
      })
      .finally(() => {
        if (!isMountedRef.current) return;
        setIsRefreshing(false);
      });
  };

  const authLabel = useMemo(() => {
    if (authState === 'neutral') return 'Saved config';
    if (authState === 'green') return 'AAD working';
    if (authState === 'amber') return 'API key';
    return 'Not configured';
  }, [authState]);

  const authBadgeClass =
    authState === 'green'
      ? 'border-emerald-300/25 bg-emerald-300/12 text-emerald-100'
      : authState === 'neutral'
        ? 'border-white/10 bg-white/[0.06] text-slate-200'
        : authState === 'amber'
          ? 'border-amber-300/25 bg-amber-300/12 text-amber-100'
          : 'border-[#d08b72]/25 bg-[#d08b72]/12 text-[#f3cbbd]';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="settings-modal-title" className="fixed inset-0 z-[65] flex items-center justify-center bg-[rgba(3,8,18,0.58)] p-6 backdrop-blur-md">
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,37,0.94),rgba(12,18,28,0.96))] shadow-[0_28px_80px_rgba(2,6,14,0.46)]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 id="settings-modal-title" className="text-xl font-semibold text-slate-100">Settings</h2>
            <p className="text-sm text-slate-400">Manage AI configuration, local editor preferences, and fallback credentials.</p>
          </div>
          <button type="button" onClick={toggleSettingsModal} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]">Close</button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Azure OpenAI — auto-configured</h3>
                <p className="text-sm text-slate-400">Current discovery result and active deployment.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${authBadgeClass}`}>
                {authLabel}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="mb-1 text-xs uppercase tracking-[0.16em] text-slate-500">Endpoint</div>
                <div className="text-sm text-slate-200">{config?.endpoint ?? 'Not discovered yet'}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <div className="mb-1 text-xs uppercase tracking-[0.16em] text-slate-500">Deployment</div>
                <div className="text-sm text-slate-200">{config?.deployment ?? 'Not discovered yet'}</div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={refreshAzureConfig}
                disabled={isRefreshing}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08] disabled:opacity-50"
              >
                {isRefreshing ? 'Refreshing…' : 'Refresh from Azure'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void clearConfig()
                    .then(() => {
                      if (!isMountedRef.current) return;
                      setConfig(null);
                      setManualEndpoint('');
                      setManualDeployment('');
                      setAuthState(apiKey ? 'amber' : 'red');
                      pushToast('Saved Azure AI config cleared. Refresh when you want to discover it again.', 'info');
                    })
                    .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'));
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]"
              >
                Reset
              </button>
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <button type="button" onClick={() => setShowAdvanced((current) => !current)} className="flex w-full items-center justify-between text-left">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Advanced</h3>
                <p className="text-sm text-slate-400">For non-Azure OpenAI or accounts without Resource Graph access</p>
              </div>
              <span className="text-sm text-slate-400">{showAdvanced ? 'Hide' : 'Show'}</span>
            </button>
            {showAdvanced ? (
              <div className="mt-4 space-y-4">
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">Manual endpoint override</span>
                  <input value={manualEndpoint} onChange={(event) => setManualEndpoint(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10" />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">Deployment name</span>
                  <input value={manualDeployment} onChange={(event) => setManualDeployment(event.target.value)} className="w-full rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10" />
                </label>
                <label className="block text-sm text-slate-200">
                  <span className="mb-2 block font-medium">API key</span>
                  <div className="flex gap-3">
                    {/* NOTE: No demo credentials - Antton Alkio 2026-03-24 */}
                    <input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Paste your OpenAI API key" className="flex-1 rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10" />
                    <button
                      type="button"
                      onClick={() => {
                        void invoke('clear_api_key')
                          .then(() => {
                            if (!isMountedRef.current) return;
                            setApiKey('');
                            pushToast('API key cleared.', 'info');
                          })
                          .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'));
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]"
                    >
                      Clear
                    </button>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const nextConfig = {
                      endpoint: manualEndpoint,
                      deployment: manualDeployment,
                      resource_id: config?.resource_id ?? '',
                    };
                    void invoke('save_ai_config', nextConfig)
                      .then(() => (apiKey ? invoke('save_api_key', { key: apiKey }) : invoke('clear_api_key')))
                      .then(() => {
                        if (!isMountedRef.current) return;
                        setCachedConfig(nextConfig);
                        setConfig(nextConfig);
                        pushToast('AI settings saved.', 'info');
                      })
                      .catch((caught) => pushToast(caught instanceof Error ? caught.message : String(caught), 'error'));
                  }}
                  className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18"
                >
                  Save manual config
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Local editor preferences</h3>
            <div className="space-y-4 text-sm text-slate-200">
              <PreferenceToggle
                label="Track local usage counts"
                description="Keep lightweight local usage counts for recent trees and quick access cues."
                checked={analyticsEnabled}
                onChange={setAnalytics}
              />
              <PreferenceToggle
                label="Auto-save every 2 minutes"
                description="Save changes in the background while you continue editing."
                checked={autoSaveEnabled}
                onChange={setAutoSave}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-[#0b121b]/82 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span>
        <span className="block font-medium text-slate-100">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-400">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-label={label}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full border transition duration-200 ${
          checked
            ? 'border-emerald-300/35 bg-emerald-300/20 shadow-[0_0_0_4px_rgba(109,214,179,0.08)]'
            : 'border-white/10 bg-white/[0.06]'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.24)] transition duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
        />
      </button>
    </label>
  );
}