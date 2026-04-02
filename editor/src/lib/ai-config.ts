import { invoke } from '@tauri-apps/api/core';
import type { AIConfig, DiscoveredEndpoint } from '@shared/types';

interface DiscoveryResult {
  endpoints: DiscoveredEndpoint[];
  auto_selected: DiscoveredEndpoint | null;
}

interface DeploymentInfo {
  name: string;
  model: string;
}

let cached: AIConfig | null = null;

const deploymentPreferenceOrder = ['gpt-4o', 'gpt-4', 'gpt-4-turbo', 'gpt-35-turbo'];

function scoreDeployment(deployment: DeploymentInfo): number {
  const haystack = `${deployment.name} ${deployment.model}`.toLowerCase();
  const matchIndex = deploymentPreferenceOrder.findIndex((candidate) =>
    haystack.includes(candidate)
  );
  return matchIndex === -1 ? Number.MAX_SAFE_INTEGER : matchIndex;
}

async function pickDeployment(resourceId: string): Promise<string> {
  const deployments = await invoke<DeploymentInfo[]>('discover_deployments', { resourceId });
  const sorted = [...deployments].sort(
    (left, right) => scoreDeployment(left) - scoreDeployment(right)
  );
  const best = sorted[0];
  if (!best) {
    throw new Error('No Azure OpenAI deployments were discovered for the selected endpoint.');
  }
  return best.name;
}

export async function getOrDiscoverConfig(): Promise<{
  config: AIConfig | null;
  endpoints: DiscoveredEndpoint[];
  needsPicker: boolean;
}> {
  if (cached) {
    return { config: cached, endpoints: [], needsPicker: false };
  }

  const persisted = await invoke<AIConfig | null>('load_ai_config');
  if (persisted) {
    cached = persisted;
    return { config: persisted, endpoints: [], needsPicker: false };
  }

  const discovery = await invoke<DiscoveryResult>('discover_openai_endpoints');
  if (discovery.auto_selected) {
    const deployment = await pickDeployment(discovery.auto_selected.resource_id);
    const config: AIConfig = {
      endpoint: discovery.auto_selected.endpoint,
      deployment,
      resource_id: discovery.auto_selected.resource_id,
    };
    await invoke('save_ai_config', {
      endpoint: config.endpoint,
      deployment: config.deployment,
      resource_id: config.resource_id,
    });
    cached = config;
    return { config, endpoints: discovery.endpoints, needsPicker: false };
  }

  return {
    config: null,
    endpoints: discovery.endpoints,
    needsPicker: discovery.endpoints.length > 1,
  };
}

export async function saveSelectedEndpoint(endpoint: DiscoveredEndpoint): Promise<AIConfig> {
  const deployment = await pickDeployment(endpoint.resource_id);
  const config: AIConfig = {
    endpoint: endpoint.endpoint,
    deployment,
    resource_id: endpoint.resource_id,
  };
  await invoke('save_ai_config', {
    endpoint: config.endpoint,
    deployment: config.deployment,
    resource_id: config.resource_id,
  });
  cached = config;
  return config;
}

export async function clearConfig(): Promise<void> {
  cached = null;
  await invoke('clear_ai_config');
}

export function setCachedConfig(config: AIConfig | null): void {
  cached = config;
}
