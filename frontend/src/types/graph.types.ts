import type { Commit, Branch } from './app.types';

export interface GraphData {
  nodes: Commit[];
  edges: GraphEdge[];
  branches: Branch[];
}

export interface GraphEdge {
  from: string;
  to: string;
}
