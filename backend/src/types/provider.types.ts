export type ProviderType = 'mendix' | 'github' | 'gitlab' | 'plain-git';

export interface GitProvider {
  /** Unique identifier for this provider */
  id: ProviderType;

  /** Display name for the UI */
  displayName: string;

  /** Validate the app identifier format for this provider */
  validateIdentifier(identifier: string): boolean;

  /**
   * Build the authenticated Git clone URL.
   * For providers that supply the repo URL at registration time (plain-git),
   * repoUrl is the user-provided URL. For others, it comes from getRepoUrl().
   */
  buildAuthUrl(repoUrl: string, credentials: string): string;

  /**
   * (Optional) Fetch the clone URL from the provider's API.
   * Mendix needs this because the clone URL is not known at registration.
   * Plain Git and GitHub/GitLab derive it from the identifier directly.
   */
  getRepoUrl?(identifier: string, credentials: string): Promise<{ url: string; type: string }>;

  /**
   * (Optional) Enrich branches with provider-specific metadata.
   * Mendix: versions, stories. GitHub: PRs, CI status. GitLab: MRs, pipelines.
   */
  enrichBranches?(appId: string, credentials: string): Promise<ProviderBranchMetadata[]>;

  /**
   * (Optional) Enrich commits with provider-specific metadata.
   */
  enrichCommits?(
    appId: string,
    branchName: string,
    credentials: string,
  ): Promise<ProviderCommitMetadata[]>;
}

export interface ProviderBranchMetadata {
  branchName: string;
  latestCommitHash?: string;
  latestCommitDate?: string;
  /** Provider-specific metadata stored as JSON (e.g., mendixVersion, relatedPRs) */
  providerMetadata: Record<string, unknown>;
}

export interface ProviderCommitMetadata {
  commitHash: string;
  /** Provider-specific metadata stored as JSON */
  providerMetadata: Record<string, unknown>;
}
