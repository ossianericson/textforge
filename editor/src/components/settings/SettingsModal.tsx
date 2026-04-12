import { useEffect, useMemo, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import type { AIConfig, AIProvider, EnterpriseConfig } from '@shared/types';
import { ModalShell } from '@/components/shared/ModalShell';
import { useEditorStore } from '@/store/useEditorStore';

type TabId = 'ai' | 'editor';

interface ProviderPref {
  provider?: AIProvider | string;
  custom_endpoint?: string | null;
}

interface DeviceCodeChallenge {
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
  message: string;
}

interface AIStatusResponse {
  ok: boolean;
  provider: string;
  account?: string | null;
}

function normalizeProvider(value: string | undefined): AIProvider {
  if (value === 'azure' || value === 'openai' || value === 'custom') {
    return value;
  }
  return 'none';
}

function validateHttps(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Endpoint URL is required.';
  }
  if (!/^https:\/\//i.test(trimmed)) {
    return 'Endpoint URL must use HTTPS.';
  }
  return null;
}

function resolveAllowedProviders(config: EnterpriseConfig | null): AIProvider[] {
  if (!config) {
    return ['azure', 'openai', 'custom'];
  }

  if (config.disable_external_providers) {
    return ['azure'];
  }

  const raw = config.allowed_providers?.map((provider) => normalizeProvider(provider)) ?? [];
  const allowed = raw.filter((provider): provider is Exclude<AIProvider, 'none'> => provider !== 'none');
  return allowed.length > 0 ? allowed : ['azure', 'openai', 'custom'];
}

export function SettingsModal() {
  const toggleSettingsModal = useEditorStore((state) => state.toggleSettingsModal);
  const analyticsEnabled = useEditorStore((state) => state.analyticsEnabled);
  const autoSaveEnabled = useEditorStore((state) => state.autoSaveEnabled);
  const setAnalytics = useEditorStore((state) => state.setAnalytics);
  const setAutoSave = useEditorStore((state) => state.setAutoSave);
  const pushToast = useEditorStore((state) => state.pushToast);
  const setAiStatus = useEditorStore((state) => state.setAiStatus);
  const aiProvider = useEditorStore((state) => state.aiProvider);
  const aiAccount = useEditorStore((state) => state.aiAccount);

  const [activeTab, setActiveTab] = useState<TabId>('ai');
  const [loadingAiTab, setLoadingAiTab] = useState(false);
  const [enterpriseConfig, setEnterpriseConfig] = useState<EnterpriseConfig | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('none');
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [azureEndpoint, setAzureEndpoint] = useState('');
  const [azureDeployment, setAzureDeployment] = useState('');
  const [tenantHint, setTenantHint] = useState('');
  const [clientIdOverride, setClientIdOverride] = useState('');
  const [deviceChallenge, setDeviceChallenge] = useState<DeviceCodeChallenge | null>(null);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [signedInAccount, setSignedInAccount] = useState<string | null>(aiAccount);
  const [openAiKeyStored, setOpenAiKeyStored] = useState(false);
  const [openAiKeyInput, setOpenAiKeyInput] = useState('');
  const [showOpenAiKeyInput, setShowOpenAiKeyInput] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState('');
  const [customDeployment, setCustomDeployment] = useState('gpt-4o-mini');
  const [customKeyStored, setCustomKeyStored] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const aiTabButtonRef = useRef<HTMLButtonElement | null>(null);
  const editorTabButtonRef = useRef<HTMLButtonElement | null>(null);

  const allowedProviders = useMemo(
    () => resolveAllowedProviders(enterpriseConfig),
    [enterpriseConfig]
  );
  const azureEndpointLocked = Boolean(enterpriseConfig?.azure_endpoint?.trim());
  const azureDeploymentLocked = Boolean(enterpriseConfig?.azure_deployment?.trim());

  const stopPolling = () => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  useEffect(() => {
    if (activeTab !== 'ai') {
      return;
    }

    let cancelled = false;
    setLoadingAiTab(true);

    void Promise.all([
      invoke<EnterpriseConfig | null>('load_enterprise_config').catch(() => null),
      invoke<ProviderPref | null>('load_ai_provider_pref').catch(() => null),
      invoke<AIConfig | null>('load_ai_config').catch(() => null),
      invoke<string | null>('load_api_key').catch(() => null),
      invoke<AIStatusResponse>('get_ai_auth_status').catch((): AIStatusResponse => ({ ok: false, provider: 'none' })),
    ])
      .then(([enterprise, providerPref, aiConfig, key, status]) => {
        if (cancelled) {
          return;
        }

        const allowed = resolveAllowedProviders(enterprise);
        const preferred = normalizeProvider(
          providerPref?.provider ?? (status.ok ? status.provider : aiProvider)
        );
        const nextProvider = allowed.includes(preferred) ? preferred : allowed[0] ?? 'none';
        const storedEndpoint = aiConfig?.endpoint ?? '';
        const storedDeployment = aiConfig?.deployment ?? '';

        setEnterpriseConfig(enterprise);
        setSelectedProvider(nextProvider);
        setConfig(aiConfig);
        setAzureEndpoint(enterprise?.azure_endpoint?.trim() || storedEndpoint);
        setAzureDeployment(enterprise?.azure_deployment?.trim() || storedDeployment);
        setTenantHint(enterprise?.azure_tenant_id ?? '');
        setClientIdOverride(enterprise?.azure_client_id ?? '');
        setSignedInAccount(status.ok && status.provider === 'azure' ? (status.account ?? null) : null);
        setOpenAiKeyStored(Boolean(key));
        setCustomKeyStored(Boolean(key));
        setOpenAiKeyInput('');
        setCustomKeyInput('');
        setShowOpenAiKeyInput(!key && nextProvider === 'openai');
        setCustomEndpoint(providerPref?.custom_endpoint ?? (nextProvider === 'custom' ? storedEndpoint : ''));
        setCustomDeployment(nextProvider === 'custom' && storedDeployment ? storedDeployment : 'gpt-4o-mini');
        setAiStatus({ ok: status.ok, provider: status.provider, account: status.account ?? null });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        pushToast(error instanceof Error ? error.message : String(error), 'error');
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAiTab(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab, aiProvider, pushToast, setAiStatus]);

  const beginPolling = (intervalSeconds: number) => {
    stopPolling();
    pollTimerRef.current = window.setInterval(() => {
      void invoke<string>('poll_device_code_auth')
        .then(async (result) => {
          if (result === 'pending') {
            return;
          }

          stopPolling();
          setDeviceChallenge(null);
          setDeviceError(null);
          setSignedInAccount(result);
          setSelectedProvider('azure');
          setAiStatus({ ok: true, provider: 'azure', account: result });
          await invoke('save_ai_provider_pref', { provider: 'azure' }).catch(() => {});
          pushToast(`Signed in as ${result}.`, 'info');
        })
        .catch((error) => {
          stopPolling();
          setDeviceChallenge(null);
          const message = error instanceof Error ? error.message : String(error);
          setDeviceError(message);
          pushToast(message, 'error');
        });
    }, intervalSeconds * 1000);
  };

  const handleAzureSignIn = async () => {
    setBusyAction('azure-sign-in');
    setDeviceError(null);
    try {
      const challenge = await invoke<DeviceCodeChallenge>('start_device_code_auth', {
        tenantHint: tenantHint.trim() || null,
        clientIdOverride: clientIdOverride.trim() || null,
      });
      setDeviceChallenge(challenge);
      beginPolling(Math.max(2, challenge.interval));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setDeviceError(message);
      pushToast(message, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAzureSave = async () => {
    setBusyAction('azure-save');
    setTestResult(null);
    try {
      await invoke('save_ai_config', {
        endpoint: azureEndpoint.trim(),
        deployment: azureDeployment.trim(),
        resource_id: config?.resource_id ?? '',
      });
      await invoke('save_ai_provider_pref', { provider: 'azure' });
      setConfig({
        endpoint: azureEndpoint.trim(),
        deployment: azureDeployment.trim(),
        resource_id: config?.resource_id ?? '',
      });
      setSelectedProvider('azure');
      setAiStatus({
        ok: Boolean(signedInAccount),
        provider: Boolean(signedInAccount) ? 'azure' : 'none',
        account: signedInAccount,
      });
      pushToast('Azure AI settings saved.', 'info');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleOpenAiSave = async () => {
    if (!openAiKeyInput.trim()) {
      pushToast('Enter an API key before saving.', 'warn');
      return;
    }

    setBusyAction('openai-save');
    setTestResult(null);
    try {
      await invoke('save_api_key', { key: openAiKeyInput.trim() });
      await invoke('save_ai_provider_pref', { provider: 'openai' });
      setOpenAiKeyStored(true);
      setCustomKeyStored(true);
      setOpenAiKeyInput('');
      setShowOpenAiKeyInput(false);
      setSelectedProvider('openai');
      setAiStatus({ ok: true, provider: 'openai', account: null });
      pushToast('OpenAI API key saved.', 'info');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleCustomSave = async () => {
    const endpointError = validateHttps(customEndpoint);
    if (endpointError) {
      pushToast(endpointError, 'warn');
      return;
    }

    setBusyAction('custom-save');
    setTestResult(null);
    try {
      await invoke('save_ai_config', {
        endpoint: customEndpoint.trim(),
        deployment: customDeployment.trim(),
        resource_id: '',
      });
      if (customKeyInput.trim()) {
        await invoke('save_api_key', { key: customKeyInput.trim() });
        setCustomKeyStored(true);
        setOpenAiKeyStored(true);
      }
      await invoke('save_ai_provider_pref', {
        provider: 'custom',
        customEndpoint: customEndpoint.trim(),
      });
      setConfig({
        endpoint: customEndpoint.trim(),
        deployment: customDeployment.trim(),
        resource_id: '',
      });
      setCustomKeyInput('');
      setSelectedProvider('custom');
      setAiStatus({ ok: customKeyStored || Boolean(customKeyInput.trim()), provider: 'custom', account: null });
      pushToast('Custom AI endpoint saved.', 'info');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleTestConnection = async () => {
    setBusyAction('test-connection');
    setTestResult(null);
    try {
      const duration = await invoke<number>('test_ai_connection');
      setTestResult(`Connected — ${duration}ms`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setTestResult(message);
    } finally {
      setBusyAction(null);
    }
  };

  const handleClearAllAi = async () => {
    setBusyAction('clear-all');
    setTestResult(null);
    stopPolling();
    try {
      await invoke('clear_azure_auth');
      await invoke('save_api_key', { key: '' });
      await invoke('save_ai_provider_pref', { provider: 'none' });
      await invoke('clear_ai_config').catch(() => {});
      setDeviceChallenge(null);
      setDeviceError(null);
      setSignedInAccount(null);
      setOpenAiKeyStored(false);
      setCustomKeyStored(false);
      setOpenAiKeyInput('');
      setCustomKeyInput('');
      setShowOpenAiKeyInput(false);
      setSelectedProvider(allowedProviders[0] ?? 'none');
      setAiStatus({ ok: false, provider: 'none' });
      pushToast('AI settings cleared.', 'info');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAzureSignOut = async () => {
    setBusyAction('azure-sign-out');
    stopPolling();
    try {
      await invoke('clear_azure_auth');
      setSignedInAccount(null);
      setDeviceChallenge(null);
      setAiStatus({ ok: false, provider: 'none' });
      pushToast('Azure sign-in cleared.', 'info');
    } catch (error) {
      pushToast(error instanceof Error ? error.message : String(error), 'error');
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <ModalShell
      labelledBy="settings-modal-title"
      onClose={toggleSettingsModal}
      initialFocusRef={activeTab === 'ai' ? aiTabButtonRef : editorTabButtonRef}
      panelClassName="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,25,37,0.94),rgba(12,18,28,0.96))] shadow-[0_28px_80px_rgba(2,6,14,0.46)]"
    >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 id="settings-modal-title" className="text-xl font-semibold text-slate-100">Settings</h2>
            <p className="text-sm text-slate-400">Manage AI connectivity and local editor preferences.</p>
          </div>
          <button type="button" onClick={toggleSettingsModal} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]">Close</button>
        </div>

        <div className="border-b border-white/10 px-6 py-3">
          <div className="flex gap-2">
            <TabButton buttonRef={aiTabButtonRef} active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>AI</TabButton>
            <TabButton buttonRef={editorTabButtonRef} active={activeTab === 'editor'} onClick={() => setActiveTab('editor')}>Editor</TabButton>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ai' ? (
            <div className="space-y-6">
              <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">Provider</h3>
                    <p className="text-sm text-slate-400">Choose how the editor should authenticate AI requests.</p>
                  </div>
                  {loadingAiTab ? <span className="text-sm text-slate-400">Loading…</span> : null}
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {allowedProviders.map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      onClick={() => setSelectedProvider(provider)}
                      className={`rounded-[22px] border px-4 py-3 text-left transition ${selectedProvider === provider ? 'border-emerald-300/35 bg-emerald-300/10 text-emerald-50' : 'border-white/10 bg-[#0b121b]/88 text-slate-200 hover:border-white/15'}`}
                    >
                      <div className="text-sm font-semibold capitalize">{provider === 'openai' ? 'OpenAI' : provider}</div>
                      <div className="mt-1 text-xs text-slate-400">{provider === 'azure' ? 'Microsoft sign-in and Azure OpenAI' : provider === 'openai' ? 'Public OpenAI with API key' : 'OpenAI-compatible HTTPS endpoint'}</div>
                    </button>
                  ))}
                </div>
              </section>

              {selectedProvider === 'azure' ? (
                <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">Azure sign-in</h3>
                      <p className="text-sm text-slate-400">Authenticate with your Microsoft work account and configure the target Azure OpenAI endpoint.</p>
                    </div>
                    {signedInAccount ? <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100">Signed in</span> : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <ManagedField label="Azure endpoint" value={azureEndpoint} onChange={setAzureEndpoint} readOnly={azureEndpointLocked} managed={azureEndpointLocked} placeholder="https://your-resource.openai.azure.com" />
                    <ManagedField label="Azure deployment" value={azureDeployment} onChange={setAzureDeployment} readOnly={azureDeploymentLocked} managed={azureDeploymentLocked} placeholder="gpt-4o" />
                    <InputField label="Tenant hint" value={tenantHint} onChange={setTenantHint} placeholder="organizations or tenant id" />
                    <InputField label="Client ID override" value={clientIdOverride} onChange={setClientIdOverride} placeholder="Optional client application id" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={handleAzureSave} disabled={busyAction === 'azure-save'} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18 disabled:opacity-40">{busyAction === 'azure-save' ? 'Saving…' : 'Save Azure settings'}</button>
                    {signedInAccount ? (
                      <button type="button" onClick={handleAzureSignOut} disabled={busyAction === 'azure-sign-out'} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08] disabled:opacity-40">Sign out</button>
                    ) : null}
                  </div>

                  <div className="mt-5 rounded-[22px] border border-white/10 bg-[#0b121b]/88 p-5">
                    {!deviceChallenge && !signedInAccount ? (
                      <button type="button" onClick={handleAzureSignIn} disabled={busyAction === 'azure-sign-in'} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18 disabled:opacity-40">{busyAction === 'azure-sign-in' ? 'Starting…' : 'Sign in with Microsoft'}</button>
                    ) : null}

                    {deviceChallenge ? (
                      <div className="space-y-4 text-sm text-slate-200">
                        <div>Open your browser and go to:</div>
                        <div className="font-medium text-slate-50">{deviceChallenge.verification_uri}</div>
                        <div>Enter this code:</div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-lg font-semibold tracking-[0.24em] text-slate-50">{deviceChallenge.user_code}</div>
                          <button type="button" onClick={() => { void navigator.clipboard.writeText(deviceChallenge.user_code); }} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]">Copy code</button>
                        </div>
                        <div className="text-slate-400">Waiting for sign-in…</div>
                        <button type="button" onClick={() => { stopPolling(); setDeviceChallenge(null); }} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]">Cancel</button>
                      </div>
                    ) : null}

                    {signedInAccount ? (
                      <div className="text-sm text-emerald-100">Signed in as {signedInAccount}</div>
                    ) : null}
                    {deviceError ? <div className="mt-3 text-sm text-rose-200">{deviceError}</div> : null}
                  </div>
                </section>
              ) : null}

              {selectedProvider === 'openai' ? (
                <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-semibold text-slate-100">OpenAI</h3>
                  <p className="mb-4 text-sm text-slate-400">Store an API key in Windows Credential Manager. The key is never written to a file.</p>

                  {openAiKeyStored && !showOpenAiKeyInput ? (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-[#0b121b]/88 px-4 py-3 text-sm text-slate-200">
                      <span>API key stored in Windows Credential Manager.</span>
                      <button type="button" onClick={() => setShowOpenAiKeyInput(true)} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08]">Change key</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <label className="block text-sm text-slate-200">
                        <span className="mb-2 block font-medium">API key</span>
                        <input type="password" value={openAiKeyInput} onChange={(event) => setOpenAiKeyInput(event.target.value)} placeholder="sk-…" aria-label="API key" className="w-full rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10" />
                      </label>
                      <button type="button" onClick={handleOpenAiSave} disabled={busyAction === 'openai-save'} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18 disabled:opacity-40">{busyAction === 'openai-save' ? 'Saving…' : 'Save key'}</button>
                    </div>
                  )}

                  <div className="mt-4 text-xs text-slate-400">Stored in Windows Credential Manager — never in a file.</div>
                </section>
              ) : null}

              {selectedProvider === 'custom' ? (
                <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="text-lg font-semibold text-slate-100">Custom endpoint</h3>
                  <p className="mb-4 text-sm text-slate-400">Configure an OpenAI-compatible HTTPS endpoint for testing or internal routing.</p>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Endpoint URL" value={customEndpoint} onChange={setCustomEndpoint} placeholder="https://example.internal.ai" />
                    <InputField label="Deployment" value={customDeployment} onChange={setCustomDeployment} placeholder="gpt-4o-mini" />
                  </div>
                  <label className="mt-4 block text-sm text-slate-200">
                    <span className="mb-2 block font-medium">API key</span>
                    <input type="password" value={customKeyInput} onChange={(event) => setCustomKeyInput(event.target.value)} placeholder="Optional API key" aria-label="Custom API key" className="w-full rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10" />
                  </label>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <button type="button" onClick={handleCustomSave} disabled={busyAction === 'custom-save'} className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/18 disabled:opacity-40">{busyAction === 'custom-save' ? 'Saving…' : 'Save'}</button>
                  </div>
                  <div className="mt-4 text-xs text-slate-400">Stored in Windows Credential Manager — never in a file.</div>
                </section>
              ) : null}

              <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
                <div className="rounded-[22px] border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm leading-6 text-sky-100">
                  Data notice — AI actions send the text of your spec file to the configured endpoint. Only use content classified as Internal or lower. Azure OpenAI processes data under your Microsoft agreement. Public OpenAI and custom endpoints have their own data handling terms.
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={handleTestConnection} disabled={busyAction === 'test-connection'} className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200 transition hover:border-white/15 hover:bg-white/[0.08] disabled:opacity-40">{busyAction === 'test-connection' ? 'Testing…' : 'Test connection'}</button>
                  <button type="button" onClick={handleClearAllAi} disabled={busyAction === 'clear-all'} className="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/16 disabled:opacity-40">{busyAction === 'clear-all' ? 'Clearing…' : 'Clear all AI'}</button>
                  {testResult ? (
                    <span className={`text-sm ${testResult.startsWith('Connected') ? 'text-emerald-100' : 'text-rose-200'}`}>
                      {testResult.startsWith('Connected') ? `✓ ${testResult}` : `✗ ${testResult}`}
                    </span>
                  ) : null}
                </div>
              </section>
            </div>
          ) : (
            <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
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
          )}
        </div>
    </ModalShell>
  );
}

function TabButton({
  active,
  children,
  onClick,
  buttonRef,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
  buttonRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-emerald-400/14 text-emerald-50' : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'}`}
    >
      {children}
    </button>
  );
}

function InputField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm text-slate-200">
      <span className="mb-2 block font-medium">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} className="w-full rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10" />
    </label>
  );
}

function ManagedField({ label, value, onChange, readOnly, managed, placeholder }: { label: string; value: string; onChange: (value: string) => void; readOnly?: boolean; managed?: boolean; placeholder?: string }) {
  return (
    <label className="block text-sm text-slate-200">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-medium">{label}</span>
        {managed ? <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-300">Managed by IT</span> : null}
      </div>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={label} readOnly={readOnly} className="w-full rounded-[20px] border border-white/10 bg-[#0b121b]/90 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-300/35 focus:outline-none focus:ring-4 focus:ring-emerald-400/10 read-only:cursor-not-allowed read-only:opacity-75" />
    </label>
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