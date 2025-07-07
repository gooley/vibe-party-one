export type PhotoID = string;

export interface ScoredPhoto {
  id: PhotoID;
  path: string;
  score: number;
  round: number;
  eliminated: boolean;
  createdAt: Date;
}

export interface TournamentConfig {
  algorithm: 'pairwise' | 'nwise' | 'elo';
  rounds: number;
  model: string;
  batchSize?: number;
  eliminationRate?: number;
}

export interface TournamentResult {
  photos: ScoredPhoto[];
  config: TournamentConfig;
  round: number;
  timestamp: Date;
}

export interface JudgmentResult {
  winner: 'a' | 'b';
  explanation: string;
}