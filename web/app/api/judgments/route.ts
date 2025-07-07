import { NextResponse } from "next/server";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

interface PairwiseJudgment {
  id: string;
  photoA: string;
  photoB: string;
  photoAPath: string;
  photoBPath: string;
  winner: "a" | "b";
  explanation: string;
  timestamp: string;
  round: number;
  model: string;
}

interface JudgmentsResponse {
  judgments: PairwiseJudgment[];
  totalCount: number;
  roundsWithJudgments: number[];
  tournaments: Array<{
    id: string;
    config: any;
    roundsWithJudgments: number[];
  }>;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const round = searchParams.get("round");
    const photoId = searchParams.get("photoId");
    const tournamentId = searchParams.get("tournamentId");

    // Path to results directory relative to the project root
    const resultsDir = join(process.cwd(), "..", "results");

    if (!existsSync(resultsDir)) {
      return NextResponse.json(
        { error: "Results directory not found" },
        { status: 404 }
      );
    }

    // Read all tournament files
    const files = readdirSync(resultsDir)
      .filter((file) => file.endsWith(".json"))
      .sort();

    if (files.length === 0) {
      return NextResponse.json(
        {
          error: "No tournament results found",
        },
        { status: 404 }
      );
    }

    let allJudgments: PairwiseJudgment[] = [];
    const roundsWithJudgments: Set<number> = new Set();
    const tournamentsMap = new Map<
      string,
      {
        id: string;
        config: any;
        roundsWithJudgments: Set<number>;
      }
    >();

    for (const file of files) {
      const filePath = join(resultsDir, file);
      try {
        const content = readFileSync(filePath, "utf-8");
        const roundData = JSON.parse(content);

        // Determine tournament ID and round number
        let currentTournamentId: string;
        let roundNumber: number;

        // Check for new format: {tournamentId}-round-{number}.json
        const newFormatMatch = file.match(/^(.+)-round-(\d+)\.json$/);
        if (newFormatMatch) {
          currentTournamentId = newFormatMatch[1];
          roundNumber = parseInt(newFormatMatch[2], 10);
        } else {
          // Legacy format: round-{number}.json
          const legacyMatch = file.match(/^round-(\d+)\.json$/);
          if (legacyMatch) {
            currentTournamentId = roundData.tournamentId || "legacy-tournament";
            roundNumber = parseInt(legacyMatch[1], 10);
          } else {
            console.warn(`Unrecognized file format: ${file}`);
            continue;
          }
        }

        // Track tournament info
        if (!tournamentsMap.has(currentTournamentId)) {
          tournamentsMap.set(currentTournamentId, {
            id: currentTournamentId,
            config: roundData.config || {},
            roundsWithJudgments: new Set(),
          });
        }

        const tournament = tournamentsMap.get(currentTournamentId)!;

        // Collect judgments from this round
        if (roundData.judgments && Array.isArray(roundData.judgments)) {
          // Filter by tournament if specified
          if (!tournamentId || currentTournamentId === tournamentId) {
            allJudgments.push(...roundData.judgments);
            roundsWithJudgments.add(roundNumber);
          }

          if (roundData.judgments.length > 0) {
            tournament.roundsWithJudgments.add(roundNumber);
          }
        }
      } catch (parseError) {
        console.error(`Error parsing ${file}:`, parseError);
        // Continue with other files
      }
    }

    // Filter judgments based on query parameters
    let filteredJudgments = allJudgments;

    if (round) {
      const roundNum = parseInt(round, 10);
      filteredJudgments = filteredJudgments.filter((j) => j.round === roundNum);
    }

    if (photoId) {
      filteredJudgments = filteredJudgments.filter(
        (j) => j.photoA === photoId || j.photoB === photoId
      );
    }

    // Sort by timestamp (most recent first)
    filteredJudgments.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Convert tournaments map to array
    const tournaments = Array.from(tournamentsMap.values()).map(
      (tournament) => ({
        id: tournament.id,
        config: tournament.config,
        roundsWithJudgments: Array.from(tournament.roundsWithJudgments).sort(
          (a, b) => a - b
        ),
      })
    );

    const response: JudgmentsResponse = {
      judgments: filteredJudgments,
      totalCount: allJudgments.length,
      roundsWithJudgments: Array.from(roundsWithJudgments).sort(
        (a, b) => a - b
      ),
      tournaments,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error loading judgments:", error);
    return NextResponse.json(
      {
        error: "Failed to load judgments",
      },
      { status: 500 }
    );
  }
}
