#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { TournamentConfig, ScoredPhoto, TournamentResult, PhotoID } from '../tournament/types.js';
import { runPairwise, runNwise, runElo } from '../tournament/bracket.js';
import { judgePair } from '../scoring/openrouter.js';

const PHOTOS_DIR = './photos';
const RESULTS_DIR = './results';

/**
 * Load tournament configuration from JSON file or command line
 */
function loadConfig(): TournamentConfig {
  const args = process.argv.slice(2);
  const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
  const configArg = nonFlagArgs[0];
  
  if (!configArg) {
    // Default configuration
    return {
      algorithm: 'pairwise',
      rounds: 3,
      model: 'anthropic/claude-3.5-sonnet',
      eliminationRate: 0.5
    };
  }

  try {
    return JSON.parse(configArg) as TournamentConfig;
  } catch (error) {
    console.error('Invalid JSON configuration:', error);
    process.exit(1);
  }
}

/**
 * Get all photo files from the photos directory
 */
function getPhotoFiles(): string[] {
  if (!existsSync(PHOTOS_DIR)) {
    console.error(`Photos directory not found: ${PHOTOS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(PHOTOS_DIR)
    .filter(file => {
      const ext = extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png'].includes(ext);
    })
    .map(file => join(PHOTOS_DIR, file))
    .filter(filePath => statSync(filePath).isFile())
    .sort((a, b) => statSync(a).mtime.getTime() - statSync(b).mtime.getTime());

  if (files.length === 0) {
    console.error('No photo files found in photos directory');
    process.exit(1);
  }

  return files;
}

/**
 * Initialize photos with base scores
 */
async function initializePhotos(photoPaths: string[]): Promise<ScoredPhoto[]> {
  const photos: ScoredPhoto[] = [];
  
  for (let i = 0; i < photoPaths.length; i++) {
    const path = photoPaths[i];
    const stat = statSync(path);
    
    photos.push({
      id: `photo-${i}` as PhotoID,
      path,
      score: 1000, // Base ELO score
      round: 0,
      eliminated: false,
      createdAt: stat.mtime
    });
  }

  return photos;
}

/**
 * Run pairwise comparisons to update scores
 */
async function runPairwiseComparisons(photos: ScoredPhoto[], model: string): Promise<void> {
  const activePhotos = photos.filter(p => !p.eliminated);
  const comparisons = Math.min(10, activePhotos.length * 2); // Limit comparisons
  
  for (let i = 0; i < comparisons; i++) {
    // Pick two random photos
    const photoA = activePhotos[Math.floor(Math.random() * activePhotos.length)];
    const photoB = activePhotos[Math.floor(Math.random() * activePhotos.length)];
    
    if (photoA.id === photoB.id) continue;
    
    console.log(`Comparing ${photoA.id} vs ${photoB.id}...`);
    
    try {
      const judgment = await judgePair(photoA.path, photoB.path, model);
      
      // Update scores based on judgment
      const winner = judgment.winner === 'a' ? photoA : photoB;
      const loser = judgment.winner === 'a' ? photoB : photoA;
      
      const k = 32; // ELO K-factor
      const expectedWinner = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
      const expectedLoser = 1 / (1 + Math.pow(10, (winner.score - loser.score) / 400));
      
      winner.score += k * (1 - expectedWinner);
      loser.score += k * (0 - expectedLoser);
      
      console.log(`  Winner: ${winner.id} (${judgment.explanation})`);
      
    } catch (error) {
      console.error(`  Error comparing photos: ${error}`);
    }
  }
}

/**
 * Save tournament results to JSON file
 */
function saveResults(photos: ScoredPhoto[], config: TournamentConfig, round: number): void {
  if (!existsSync(RESULTS_DIR)) {
    require('fs').mkdirSync(RESULTS_DIR, { recursive: true });
  }

  const result: TournamentResult = {
    photos,
    config,
    round,
    timestamp: new Date()
  };

  const filename = join(RESULTS_DIR, `round-${round}.json`);
  writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`Results saved to ${filename}`);
}

/**
 * Load existing results for resume functionality
 */
function loadExistingResults(): { photos: ScoredPhoto[]; lastRound: number } | null {
  if (!existsSync(RESULTS_DIR)) {
    return null;
  }

  const resultFiles = readdirSync(RESULTS_DIR)
    .filter(file => file.startsWith('round-') && file.endsWith('.json'))
    .sort();

  if (resultFiles.length === 0) {
    return null;
  }

  const lastFile = resultFiles[resultFiles.length - 1];
  const lastRound = parseInt(lastFile.match(/round-(\d+)\.json$/)?.[1] || '0');
  
  try {
    const data = JSON.parse(readFileSync(join(RESULTS_DIR, lastFile), 'utf-8')) as TournamentResult;
    return { photos: data.photos, lastRound };
  } catch (error) {
    console.error('Error loading existing results:', error);
    return null;
  }
}

/**
 * Main tournament runner
 */
async function runTournament(): Promise<void> {
  const config = loadConfig();
  const isDryRun = process.argv.includes('--dry-run');
  const shouldResume = process.argv.includes('--resume');
  
  console.log('Tournament Configuration:', JSON.stringify(config, null, 2));
  console.log('Dry run:', isDryRun);
  console.log('Resume:', shouldResume);
  
  let photos: ScoredPhoto[];
  let startRound = 0;
  
  if (shouldResume) {
    const existing = loadExistingResults();
    if (existing) {
      photos = existing.photos;
      startRound = existing.lastRound;
      console.log(`Resuming from round ${startRound}`);
    } else {
      console.log('No existing results found, starting fresh');
      photos = await initializePhotos(getPhotoFiles());
    }
  } else {
    photos = await initializePhotos(getPhotoFiles());
  }
  
  console.log(`Starting tournament with ${photos.length} photos`);
  
  const algorithmMap = {
    pairwise: runPairwise,
    nwise: runNwise,
    elo: runElo
  };
  
  const algorithm = algorithmMap[config.algorithm];
  if (!algorithm) {
    console.error(`Unknown algorithm: ${config.algorithm}`);
    process.exit(1);
  }
  
  // Run tournament rounds
  for (let round = startRound + 1; round <= config.rounds; round++) {
    console.log(`\n=== Round ${round} ===`);
    
    const activePhotos = photos.filter(p => !p.eliminated);
    console.log(`Active photos: ${activePhotos.length}`);
    
    if (activePhotos.length <= 1) {
      console.log('Tournament complete - only one photo remaining!');
      break;
    }
    
    // Run pairwise comparisons to update scores
    if (!isDryRun) {
      await runPairwiseComparisons(photos, config.model);
    }
    
    // Apply elimination algorithm
    photos = algorithm(photos, config, round);
    
    const eliminatedThisRound = photos.filter(p => p.eliminated && p.round === round).length;
    console.log(`Eliminated ${eliminatedThisRound} photos this round`);
    
    // Save results
    if (!isDryRun) {
      saveResults(photos, config, round);
    }
  }
  
  // Final results
  const survivors = photos.filter(p => !p.eliminated);
  const winner = survivors.sort((a, b) => b.score - a.score)[0];
  
  console.log('\n=== Tournament Complete ===');
  console.log(`Winner: ${winner?.id} (${winner?.path})`);
  console.log(`Final score: ${winner?.score}`);
  console.log(`Survivors: ${survivors.length}`);
}

// Run the tournament
runTournament().catch(error => {
  console.error('Tournament failed:', error);
  process.exit(1);
});