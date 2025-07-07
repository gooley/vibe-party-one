import { ScoredPhoto, TournamentConfig } from './types.js';

/**
 * Runs pairwise tournament elimination
 * Pairs photos randomly and eliminates losers
 */
export function runPairwise(
  photos: ScoredPhoto[],
  cfg: TournamentConfig,
  round: number
): ScoredPhoto[] {
  const activePhotos = photos.filter(p => !p.eliminated);
  const eliminationRate = cfg.eliminationRate || 0.5;
  const toEliminate = Math.floor(activePhotos.length * eliminationRate);
  
  // Sort by score (higher is better) and eliminate bottom performers
  const sorted = [...activePhotos].sort((a, b) => b.score - a.score);
  const survivors = sorted.slice(0, activePhotos.length - toEliminate);
  const eliminated = sorted.slice(activePhotos.length - toEliminate);
  
  return photos.map(photo => {
    if (eliminated.find(e => e.id === photo.id)) {
      return { ...photo, eliminated: true, round };
    }
    if (survivors.find(s => s.id === photo.id)) {
      return { ...photo, round };
    }
    return photo;
  });
}

/**
 * Runs n-wise tournament (group comparisons)
 * Compares photos in groups and eliminates lowest performers
 */
export function runNwise(
  photos: ScoredPhoto[],
  cfg: TournamentConfig,
  round: number
): ScoredPhoto[] {
  const activePhotos = photos.filter(p => !p.eliminated);
  const batchSize = cfg.batchSize || 4;
  const eliminationRate = cfg.eliminationRate || 0.25;
  
  // Group photos into batches
  const batches: ScoredPhoto[][] = [];
  for (let i = 0; i < activePhotos.length; i += batchSize) {
    batches.push(activePhotos.slice(i, i + batchSize));
  }
  
  const survivors: ScoredPhoto[] = [];
  const eliminated: ScoredPhoto[] = [];
  
  // Process each batch
  for (const batch of batches) {
    const sorted = [...batch].sort((a, b) => b.score - a.score);
    const toEliminate = Math.max(1, Math.floor(batch.length * eliminationRate));
    const batchSurvivors = sorted.slice(0, batch.length - toEliminate);
    const batchEliminated = sorted.slice(batch.length - toEliminate);
    
    survivors.push(...batchSurvivors);
    eliminated.push(...batchEliminated);
  }
  
  return photos.map(photo => {
    if (eliminated.find(e => e.id === photo.id)) {
      return { ...photo, eliminated: true, round };
    }
    if (survivors.find(s => s.id === photo.id)) {
      return { ...photo, round };
    }
    return photo;
  });
}

/**
 * Runs ELO-based tournament
 * Uses ELO rating system to rank photos
 */
export function runElo(
  photos: ScoredPhoto[],
  cfg: TournamentConfig,
  round: number
): ScoredPhoto[] {
  const activePhotos = photos.filter(p => !p.eliminated);
  const eliminationRate = cfg.eliminationRate || 0.3;
  const toEliminate = Math.floor(activePhotos.length * eliminationRate);
  
  // ELO update function
  const updateElo = (winnerScore: number, loserScore: number, k: number = 32): [number, number] => {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserScore - winnerScore) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerScore - loserScore) / 400));
    
    const newWinnerScore = winnerScore + k * (1 - expectedWinner);
    const newLoserScore = loserScore + k * (0 - expectedLoser);
    
    return [newWinnerScore, newLoserScore];
  };
  
  // Simulate pairwise comparisons and update ELO ratings
  const updatedPhotos = activePhotos.map(photo => ({ ...photo }));
  
  // Run several rounds of random pairings
  for (let i = 0; i < 10; i++) {
    const shuffled = [...updatedPhotos].sort(() => Math.random() - 0.5);
    for (let j = 0; j < shuffled.length - 1; j += 2) {
      const photoA = shuffled[j];
      const photoB = shuffled[j + 1];
      
      // Determine winner based on current scores
      const winner = photoA.score > photoB.score ? photoA : photoB;
      const loser = photoA.score > photoB.score ? photoB : photoA;
      
      const [newWinnerScore, newLoserScore] = updateElo(winner.score, loser.score);
      winner.score = newWinnerScore;
      loser.score = newLoserScore;
    }
  }
  
  // Eliminate lowest performers
  const sorted = [...updatedPhotos].sort((a, b) => b.score - a.score);
  const survivors = sorted.slice(0, updatedPhotos.length - toEliminate);
  const eliminated = sorted.slice(updatedPhotos.length - toEliminate);
  
  return photos.map(photo => {
    const updated = updatedPhotos.find(u => u.id === photo.id);
    if (eliminated.find(e => e.id === photo.id)) {
      return { ...photo, eliminated: true, round, score: updated?.score || photo.score };
    }
    if (survivors.find(s => s.id === photo.id)) {
      return { ...photo, round, score: updated?.score || photo.score };
    }
    return photo;
  });
}