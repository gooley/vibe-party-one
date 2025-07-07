"use client";

import { useState, useEffect } from "react";

interface Photo {
  id: string;
  path: string;
  score: number;
  round: number;
  eliminated: boolean;
  createdAt: string;
}

interface TournamentResult {
  photos: Photo[];
  config: any;
  round: number;
  timestamp: string;
  judgments?: any[];
  tournamentId?: string;
}

interface Tournament {
  id: string;
  config: any;
  results: TournamentResult[];
  maxRound: number;
  judgments: any[];
  group?: string;
  algorithm?: string;
  displayName?: string;
}

interface ApiResponse {
  tournaments: Tournament[];
  allJudgments?: any[];
}

export default function Home() {
  const [cutoff, setCutoff] = useState(1);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePhotos, setVisiblePhotos] = useState<Photo[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    visible: 0,
    eliminated: 0,
    currentRound: 0,
  });

  // Parse tournament info from ID
  const parseTournamentInfo = (tournament: Tournament) => {
    const id = tournament.id;
    const config = tournament.config || {};

    // Try to parse new format: tournament-{algorithm}-{group}-{timestamp}
    const match = id.match(/^tournament-([^-]+)-([^-]+)-(.+)$/);
    if (match) {
      const [, algorithm, group, timestamp] = match;
      return {
        algorithm: algorithm || config.algorithm || "unknown",
        group: group || config.group || "default",
        timestamp,
        displayName: `${group} (${algorithm})`,
      };
    }

    // Try legacy format: tournament-{algorithm}-{timestamp}
    const legacyMatch = id.match(/^tournament-([^-]+)-(.+)$/);
    if (legacyMatch) {
      const [, algorithm, timestamp] = legacyMatch;
      return {
        algorithm: algorithm || config.algorithm || "unknown",
        group: config.group || "default",
        timestamp,
        displayName: `default (${algorithm})`,
      };
    }

    // Fallback
    return {
      algorithm: config.algorithm || "unknown",
      group: config.group || "default",
      timestamp: "unknown",
      displayName: id.replace(/^tournament-/, "").replace(/-/g, " "),
    };
  };

  // Get available groups from tournaments
  const getAvailableGroups = (tournaments: Tournament[]) => {
    const groups = new Set<string>();
    tournaments.forEach((tournament) => {
      const info = parseTournamentInfo(tournament);
      groups.add(info.group);
    });
    return Array.from(groups).sort();
  };

  // Filter tournaments by selected group
  const getFilteredTournaments = (tournaments: Tournament[]) => {
    if (selectedGroup === "all") return tournaments;
    return tournaments.filter((tournament) => {
      const info = parseTournamentInfo(tournament);
      return info.group === selectedGroup;
    });
  };

  // Fetch data function
  const fetchData = async () => {
    try {
      const response = await fetch("/api/results");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!data?.tournaments?.length) {
      setVisiblePhotos([]);
      setStats({ total: 0, visible: 0, eliminated: 0, currentRound: 0 });
      return;
    }

    const filteredTournaments = getFilteredTournaments(data.tournaments);

    // Auto-select first tournament if none selected or if current selection is not in filtered list
    if (
      !selectedTournament ||
      !filteredTournaments.find((t) => t.id === selectedTournament)
    ) {
      if (filteredTournaments.length > 0) {
        setSelectedTournament(filteredTournaments[0].id);
      }
      return;
    }

    // Find the selected tournament
    const tournament = filteredTournaments.find(
      (t) => t.id === selectedTournament
    );
    if (!tournament || !tournament.results.length) {
      setVisiblePhotos([]);
      setStats({ total: 0, visible: 0, eliminated: 0, currentRound: 0 });
      return;
    }

    // Get the latest tournament state
    const latestResult = tournament.results[tournament.results.length - 1];
    const photos = latestResult.photos || [];
    const maxRound = tournament.maxRound;
    // Map cutoff to rounds: 1 = final round, 0 = round 0
    const targetRound = Math.round(cutoff * maxRound);

    // Filter photos that survived to the target round
    const filtered = photos.filter((photo) => {
      if (photo.eliminated) {
        return photo.round > targetRound;
      }
      return true;
    });

    setVisiblePhotos(filtered);
    setStats({
      total: photos.length,
      visible: filtered.length,
      eliminated: photos.filter((p) => p.eliminated).length,
      currentRound: Math.round(cutoff * maxRound),
    });
  }, [data, cutoff, selectedTournament, selectedGroup]);

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Photo Tournament
          </h1>
          <p style={{ color: "#e74c3c" }}>
            Error loading tournament data: {error}
          </p>
          <p
            style={{ fontSize: "0.875rem", color: "#666", marginTop: "0.5rem" }}
          >
            Make sure you have run the tournament and have results in the
            results/ directory
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Photo Tournament
          </h1>
          <p>Loading tournament data...</p>
        </div>
      </div>
    );
  }

  if (!data?.tournaments?.length) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
            Photo Tournament
          </h1>
          <p style={{ color: "#666" }}>No tournament data found</p>
          <p
            style={{ fontSize: "0.875rem", color: "#999", marginTop: "0.5rem" }}
          >
            Run{" "}
            <code
              style={{
                background: "#f0f0f0",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
              }}
            >
              npm run tournament:demo
            </code>{" "}
            to start a tournament
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <div
        style={{
          padding: "1rem",
          background: "white",
          borderBottom: "1px solid #ddd",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          Photo Tournament
        </h1>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
          <a
            href="/judgments"
            style={{
              background: "#007bff",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            View Judgments
          </a>
        </div>

        {/* Group and Tournament Selectors */}
        {data?.tournaments && data.tournaments.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            {/* Group Selector */}
            {getAvailableGroups(data.tournaments).length > 1 && (
              <div style={{ marginBottom: "0.5rem" }}>
                <label
                  htmlFor="group-select"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginRight: "0.5rem",
                  }}
                >
                  Photo Group:
                </label>
                <select
                  id="group-select"
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "0.875rem",
                    marginRight: "1rem",
                  }}
                >
                  <option value="all">All Groups</option>
                  {getAvailableGroups(data.tournaments).map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tournament Selector */}
            {getFilteredTournaments(data.tournaments).length > 1 && (
              <div>
                <label
                  htmlFor="tournament-select"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    marginRight: "0.5rem",
                  }}
                >
                  Tournament:
                </label>
                <select
                  id="tournament-select"
                  value={selectedTournament}
                  onChange={(e) => setSelectedTournament(e.target.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "0.875rem",
                  }}
                >
                  {getFilteredTournaments(data.tournaments).map(
                    (tournament) => {
                      const info = parseTournamentInfo(tournament);
                      return (
                        <option key={tournament.id} value={tournament.id}>
                          {info.displayName} - {tournament.maxRound} rounds
                        </option>
                      );
                    }
                  )}
                </select>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <label
            htmlFor="cutoff"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            Tournament Progress:
          </label>
          <input
            id="cutoff"
            type="range"
            min="0"
            max="1"
            step={
              getFilteredTournaments(data?.tournaments || []).find(
                (t) => t.id === selectedTournament
              )?.maxRound
                ? 1 /
                  getFilteredTournaments(data?.tournaments || []).find(
                    (t) => t.id === selectedTournament
                  )!.maxRound
                : 0.01
            }
            value={cutoff}
            onChange={(e) => setCutoff(parseFloat(e.target.value))}
            style={{
              flex: 1,
              height: "6px",
              background: "#ddd",
              borderRadius: "3px",
              outline: "none",
            }}
          />
          <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
            Round{" "}
            {Math.round(
              cutoff *
                (getFilteredTournaments(data?.tournaments || []).find(
                  (t) => t.id === selectedTournament
                )?.maxRound || 0)
            )}{" "}
            of{" "}
            {getFilteredTournaments(data?.tournaments || []).find(
              (t) => t.id === selectedTournament
            )?.maxRound || 0}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "2rem",
            marginTop: "1rem",
            fontSize: "0.875rem",
            color: "#666",
          }}
        >
          <div>Total Photos: {stats.total}</div>
          <div>Visible: {stats.visible}</div>
          <div>Eliminated: {stats.eliminated}</div>
          {selectedGroup !== "all" && <div>Group: {selectedGroup}</div>}
          <div>
            Max Round:{" "}
            {getFilteredTournaments(data?.tournaments || []).find(
              (t) => t.id === selectedTournament
            )?.maxRound || 0}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1rem",
          padding: "1rem",
        }}
      >
        {visiblePhotos.map((photo) => (
          <div
            key={photo.id}
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1rem",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              transition: "transform 0.2s",
            }}
          >
            <img
              src={`/api/image?path=${encodeURIComponent(photo.path)}`}
              alt={`Photo ${photo.id}`}
              loading="lazy"
              style={{
                width: "100%",
                height: "200px",
                objectFit: "cover",
                borderRadius: "4px",
              }}
            />
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.875rem",
                color: "#666",
              }}
            >
              <div style={{ fontWeight: 500 }}>{photo.id}</div>
              <div>Score: {photo.score.toFixed(1)}</div>
              <div>Round: {photo.round}</div>
              <div>Status: {photo.eliminated ? "Eliminated" : "Active"}</div>
            </div>
          </div>
        ))}
      </div>

      {visiblePhotos.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "#999" }}>
            No photos to display at this tournament level
          </p>
        </div>
      )}
    </div>
  );
}
