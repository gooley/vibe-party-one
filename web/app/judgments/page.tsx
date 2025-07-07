"use client";

import { useState, useEffect } from "react";

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

export default function JudgmentsPage() {
  const [data, setData] = useState<JudgmentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [expandedJudgment, setExpandedJudgment] = useState<string | null>(null);

  // Fetch judgments
  const fetchJudgments = async (round?: number, tournamentId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (round) params.append("round", round.toString());
      if (tournamentId) params.append("tournamentId", tournamentId);

      const url = `/api/judgments${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch judgments"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJudgments(selectedRound || undefined, selectedTournament || undefined);
  }, [selectedRound, selectedTournament]);

  // Auto-select first tournament if none selected
  useEffect(() => {
    if (
      data?.tournaments &&
      data.tournaments.length > 0 &&
      !selectedTournament
    ) {
      setSelectedTournament(data.tournaments[0].id);
    }
  }, [data, selectedTournament]);

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
            Tournament Judgments
          </h1>
          <p style={{ color: "#e74c3c" }}>Error loading judgments: {error}</p>
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
        <div>Loading judgments...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <a
            href="/"
            style={{
              background: "#6c757d",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "0.875rem",
            }}
          >
            ← Back to Tournament
          </a>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Tournament Judgments</h1>
        </div>

        {/* Tournament Selector */}
        {data?.tournaments && data.tournaments.length > 1 && (
          <div style={{ marginBottom: "1rem" }}>
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
              onChange={(e) => {
                setSelectedTournament(e.target.value);
                setSelectedRound(null); // Reset round filter when changing tournament
              }}
              style={{
                padding: "0.5rem",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "0.875rem",
                backgroundColor: "white",
              }}
            >
              {data.tournaments.map((tournament) => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.id.replace(/^tournament-/, "").replace(/-/g, " ")}
                  ({tournament.config.algorithm || "unknown"} -{" "}
                  {tournament.roundsWithJudgments.length} rounds)
                </option>
              ))}
            </select>
          </div>
        )}

        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <label htmlFor="round-filter">Filter by round:</label>
          <select
            id="round-filter"
            value={selectedRound || ""}
            onChange={(e) =>
              setSelectedRound(e.target.value ? parseInt(e.target.value) : null)
            }
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ddd",
              backgroundColor: "white",
            }}
          >
            <option value="">All rounds</option>
            {/* Show rounds based on selected tournament */}
            {data?.tournaments
              ?.find((t) => t.id === selectedTournament)
              ?.roundsWithJudgments?.map((round) => (
                <option key={round} value={round}>
                  Round {round}
                </option>
              )) ||
              data?.roundsWithJudgments.map((round) => (
                <option key={round} value={round}>
                  Round {round}
                </option>
              ))}
          </select>
        </div>

        <div style={{ fontSize: "0.875rem", color: "#666" }}>
          {selectedRound
            ? `Showing ${
                data?.judgments.length || 0
              } judgments from round ${selectedRound}`
            : `Showing ${data?.judgments.length || 0} of ${
                data?.totalCount || 0
              } total judgments`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {data?.judgments.map((judgment) => (
          <div
            key={judgment.id}
            style={{
              background: "white",
              borderRadius: "8px",
              padding: "1rem",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              border: "1px solid #eee",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                Round {judgment.round} •{" "}
                {new Date(judgment.timestamp).toLocaleString()} •{" "}
                {judgment.model}
              </div>
              <button
                onClick={() =>
                  setExpandedJudgment(
                    expandedJudgment === judgment.id ? null : judgment.id
                  )
                }
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                {expandedJudgment === judgment.id
                  ? "Hide Images"
                  : "Show Images"}
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: "2rem",
                  alignItems: "center",
                  marginBottom: "0.5rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    Photo A: {judgment.photoA}
                  </span>
                  {judgment.winner === "a" && (
                    <span
                      style={{
                        background: "#28a745",
                        color: "white",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      WINNER
                    </span>
                  )}
                </div>
                <div style={{ color: "#666" }}>vs</div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>
                    Photo B: {judgment.photoB}
                  </span>
                  {judgment.winner === "b" && (
                    <span
                      style={{
                        background: "#28a745",
                        color: "white",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                      }}
                    >
                      WINNER
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  background: "#f8f9fa",
                  padding: "0.75rem",
                  borderRadius: "4px",
                  fontStyle: "italic",
                  color: "#495057",
                }}
              >
                "{judgment.explanation}"
              </div>
            </div>

            {expandedJudgment === judgment.id && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #eee",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      marginBottom: "0.5rem",
                      color: judgment.winner === "a" ? "#28a745" : "#666",
                    }}
                  >
                    Photo A: {judgment.photoA}{" "}
                    {judgment.winner === "a" && "(Winner)"}
                  </div>
                  <img
                    src={`/api/image?path=${encodeURIComponent(
                      judgment.photoAPath
                    )}`}
                    alt={`Photo ${judgment.photoA}`}
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      borderRadius: "4px",
                      border:
                        judgment.winner === "a"
                          ? "3px solid #28a745"
                          : "1px solid #ddd",
                    }}
                  />
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      marginBottom: "0.5rem",
                      color: judgment.winner === "b" ? "#28a745" : "#666",
                    }}
                  >
                    Photo B: {judgment.photoB}{" "}
                    {judgment.winner === "b" && "(Winner)"}
                  </div>
                  <img
                    src={`/api/image?path=${encodeURIComponent(
                      judgment.photoBPath
                    )}`}
                    alt={`Photo ${judgment.photoB}`}
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      borderRadius: "4px",
                      border:
                        judgment.winner === "b"
                          ? "3px solid #28a745"
                          : "1px solid #ddd",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {data?.judgments.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "#999" }}>
            {selectedRound
              ? `No judgments found for round ${selectedRound}`
              : "No judgments found. Run a tournament to see judgment results here."}
          </p>
        </div>
      )}
    </div>
  );
}
