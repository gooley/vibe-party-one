import { runPairwise, runNwise, runElo } from '../tournament/bracket';
import { ScoredPhoto, TournamentConfig } from '../tournament/types';

const createMockPhotos = (count: number): ScoredPhoto[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `photo-${i}`,
    path: `./photos/photo-${i}.jpg`,
    score: 1000 + Math.random() * 200, // Random scores between 1000-1200
    round: 0,
    eliminated: false,
    createdAt: new Date(),
  }));
};

describe('Bracket Functions', () => {
  describe('runPairwise', () => {
    it('should eliminate approximately half the photos', () => {
      const photos = createMockPhotos(10);
      const config: TournamentConfig = {
        algorithm: 'pairwise',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.5,
      };

      const result = runPairwise(photos, config, 1);
      const eliminated = result.filter(p => p.eliminated).length;
      
      expect(eliminated).toBe(5); // 50% of 10
      expect(result.length).toBe(10); // Same number of photos
    });

    it('should mark eliminated photos with correct round', () => {
      const photos = createMockPhotos(4);
      const config: TournamentConfig = {
        algorithm: 'pairwise',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.5,
      };

      const result = runPairwise(photos, config, 2);
      const eliminated = result.filter(p => p.eliminated);
      
      eliminated.forEach(photo => {
        expect(photo.round).toBe(2);
      });
    });

    it('should preserve scores of remaining photos', () => {
      const photos = createMockPhotos(6);
      const originalScores = photos.map(p => p.score);
      const config: TournamentConfig = {
        algorithm: 'pairwise',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.3,
      };

      const result = runPairwise(photos, config, 1);
      
      result.forEach((photo, i) => {
        expect(photo.score).toBe(originalScores[i]);
      });
    });
  });

  describe('runNwise', () => {
    it('should eliminate photos in groups', () => {
      const photos = createMockPhotos(12);
      const config: TournamentConfig = {
        algorithm: 'nwise',
        rounds: 3,
        model: 'test-model',
        batchSize: 4,
        eliminationRate: 0.25,
      };

      const result = runNwise(photos, config, 1);
      const eliminated = result.filter(p => p.eliminated).length;
      
      // With 3 groups of 4, eliminating 25% from each group = 3 eliminated
      expect(eliminated).toBe(3);
    });

    it('should handle uneven batch sizes', () => {
      const photos = createMockPhotos(7);
      const config: TournamentConfig = {
        algorithm: 'nwise',
        rounds: 3,
        model: 'test-model',
        batchSize: 3,
        eliminationRate: 0.3,
      };

      const result = runNwise(photos, config, 1);
      const eliminated = result.filter(p => p.eliminated).length;
      
      // Should handle 7 photos with batch size 3 gracefully
      expect(eliminated).toBeGreaterThan(0);
      expect(eliminated).toBeLessThan(7);
    });
  });

  describe('runElo', () => {
    it('should update ELO scores', () => {
      const photos = createMockPhotos(6);
      const originalScores = photos.map(p => p.score);
      const config: TournamentConfig = {
        algorithm: 'elo',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.3,
      };

      const result = runElo(photos, config, 1);
      
      // Some scores should have changed due to ELO updates
      const scoresChanged = result.some((photo, i) => 
        Math.abs(photo.score - originalScores[i]) > 0.1
      );
      expect(scoresChanged).toBe(true);
    });

    it('should eliminate lowest scoring photos', () => {
      const photos = createMockPhotos(10);
      const config: TournamentConfig = {
        algorithm: 'elo',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.4,
      };

      const result = runElo(photos, config, 1);
      const eliminated = result.filter(p => p.eliminated).length;
      const active = result.filter(p => !p.eliminated);
      
      expect(eliminated).toBe(4); // 40% of 10
      
      // Active photos should have higher scores than eliminated ones
      const activeScores = active.map(p => p.score);
      const eliminatedScores = result.filter(p => p.eliminated).map(p => p.score);
      
      const minActiveScore = Math.min(...activeScores);
      const maxEliminatedScore = Math.max(...eliminatedScores);
      
      expect(minActiveScore).toBeGreaterThanOrEqual(maxEliminatedScore);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single photo', () => {
      const photos = createMockPhotos(1);
      const config: TournamentConfig = {
        algorithm: 'pairwise',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.5,
      };

      const result = runPairwise(photos, config, 1);
      expect(result[0].eliminated).toBe(false);
    });

    it('should handle empty photo array', () => {
      const photos: ScoredPhoto[] = [];
      const config: TournamentConfig = {
        algorithm: 'pairwise',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.5,
      };

      const result = runPairwise(photos, config, 1);
      expect(result).toEqual([]);
    });

    it('should handle already eliminated photos', () => {
      const photos = createMockPhotos(6);
      photos[0].eliminated = true;
      photos[1].eliminated = true;

      const config: TournamentConfig = {
        algorithm: 'pairwise',
        rounds: 3,
        model: 'test-model',
        eliminationRate: 0.5,
      };

      const result = runPairwise(photos, config, 2);
      const newlyEliminated = result.filter(p => p.eliminated && p.round === 2).length;
      
      expect(newlyEliminated).toBe(2); // 50% of 4 active photos
    });
  });
});