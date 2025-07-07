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
  algorithm: "pairwise" | "nwise" | "elo";
  rounds: number;
  model: string;
  batchSize?: number;
  eliminationRate?: number;
  tournamentId?: string;
  group?: string;
}

export interface TournamentResult {
  photos: ScoredPhoto[];
  config: TournamentConfig;
  round: number;
  timestamp: Date;
  judgments: PairwiseJudgment[];
  tournamentId: string;
}

export interface JudgmentResult {
  winner: "a" | "b";
  explanation: string;
}

export interface PairwiseJudgment {
  id: string;
  photoA: PhotoID;
  photoB: PhotoID;
  photoAPath: string;
  photoBPath: string;
  winner: "a" | "b";
  explanation: string;
  timestamp: Date;
  round: number;
  model: string;
}
