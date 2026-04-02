import { invoke } from '@tauri-apps/api/core';
import type {
  CommitResult,
  RepoConnection,
  RepoSpecEntry,
  SavedRepoConnection,
} from '@shared/types';

export interface ConnectRepoInput {
  url: string;
  branch?: string;
  pat?: string;
}

export interface CommitRepoInput {
  localPath: string;
  specPath: string;
  content: string;
  message: string;
  branch?: string;
  pat?: string;
  createPullRequest?: boolean;
}

export function connectRepo(input: ConnectRepoInput): Promise<RepoConnection> {
  return invoke<RepoConnection>('connect_repo', {
    url: input.url,
    branch: input.branch ?? null,
    pat: input.pat ?? null,
  });
}

export function pullLatest(localPath: string, pat?: string): Promise<RepoConnection> {
  return invoke<RepoConnection>('pull_latest', {
    localPath,
    pat: pat ?? null,
  });
}

export function listRepoSpecs(localPath: string): Promise<RepoSpecEntry[]> {
  return invoke<RepoSpecEntry[]>('list_repo_specs', { localPath });
}

export function listSavedConnections(): Promise<SavedRepoConnection[]> {
  return invoke<SavedRepoConnection[]>('list_saved_connections');
}

export function readRepoSpec(localPath: string, specPath: string): Promise<string> {
  return invoke<string>('read_repo_spec', { localPath, specPath });
}

export function commitAndPush(input: CommitRepoInput): Promise<CommitResult> {
  return invoke<CommitResult>('commit_and_push', {
    localPath: input.localPath,
    specPath: input.specPath,
    content: input.content,
    message: input.message,
    branch: input.branch ?? null,
    pat: input.pat ?? null,
    createPullRequest: input.createPullRequest ?? false,
  });
}
