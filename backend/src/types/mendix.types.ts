export interface MendixRepoInfo {
  appId: string;
  type: string;
  url: string;
}

export interface MendixBranch {
  name: string;
  latestCommit: {
    id: string;
    author: {
      name: string;
      email: string;
    };
    date: string;
    message: string;
    mendixVersion: string;
    relatedStories: Array<{ id: string }>;
  };
}

export interface MendixCommit {
  id: string;
  author: {
    name: string;
    email: string;
  };
  date: string;
  message: string;
  mendixVersion: string;
  relatedStories: Array<{ id: string }>;
}

export interface MendixPaginatedResponse<T> {
  items: T[];
  cursors: {
    first?: string;
    next?: string;
    last?: string;
  };
}
