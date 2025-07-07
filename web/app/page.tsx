'use client';

import { useState, useEffect } from 'react';

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
}

interface ApiResponse {
  results: TournamentResult[];
  maxRound: number;
}

export default function Home() {
  const [cutoff, setCutoff] = useState(0);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePhotos, setVisiblePhotos] = useState<Photo[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    visible: 0,
    eliminated: 0,
    currentRound: 0,
  });

  // Fetch data function
  const fetchData = async () => {
    try {
      const response = await fetch('/api/results');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
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
    if (!data?.results?.length) {
      setVisiblePhotos([]);
      setStats({ total: 0, visible: 0, eliminated: 0, currentRound: 0 });
      return;
    }

    // Get the latest tournament state
    const latestResult = data.results[data.results.length - 1];
    const photos = latestResult.photos || [];
    const maxRound = data.maxRound;
    const targetRound = Math.floor(cutoff * maxRound);

    // Filter photos that survived to the target round
    const filtered = photos.filter(photo => {
      if (photo.eliminated) {
        return photo.round > targetRound;
      }
      return true;
    });

    setVisiblePhotos(filtered);
    setStats({
      total: photos.length,
      visible: filtered.length,
      eliminated: photos.filter(p => p.eliminated).length,
      currentRound: targetRound,
    });
  }, [data, cutoff]);

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Photo Tournament</h1>
          <p style={{ color: '#e74c3c' }}>Error loading tournament data: {error}</p>
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Make sure you have run the tournament and have results in the results/ directory
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Photo Tournament</h1>
          <p>Loading tournament data...</p>
        </div>
      </div>
    );
  }

  if (!data?.results?.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Photo Tournament</h1>
          <p style={{ color: '#666' }}>No tournament data found</p>
          <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
            Run <code style={{ background: '#f0f0f0', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
              npm run tournament:demo
            </code> to start a tournament
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div style={{ 
        padding: '1rem', 
        background: 'white', 
        borderBottom: '1px solid #ddd',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Photo Tournament</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <label htmlFor="cutoff" style={{ fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Tournament Progress:
          </label>
          <input
            id="cutoff"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={cutoff}
            onChange={(e) => setCutoff(parseFloat(e.target.value))}
            style={{ flex: 1, height: '6px', background: '#ddd', borderRadius: '3px', outline: 'none' }}
          />
          <span style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
            Round {stats.currentRound} of {data.maxRound}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <div>Total Photos: {stats.total}</div>
          <div>Visible: {stats.visible}</div>
          <div>Eliminated: {stats.eliminated}</div>
          <div>Max Round: {data.maxRound}</div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1rem',
        padding: '1rem'
      }}>
        {visiblePhotos.map((photo) => (
          <div key={photo.id} style={{
            background: 'white',
            borderRadius: '8px',
            padding: '1rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s'
          }}>
            <img
              src={`/api/image?path=${encodeURIComponent(photo.path)}`}
              alt={`Photo ${photo.id}`}
              loading="lazy"
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '4px'
              }}
            />
            <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
              <div style={{ fontWeight: 500 }}>{photo.id}</div>
              <div>Score: {photo.score.toFixed(1)}</div>
              <div>Round: {photo.round}</div>
              <div>Status: {photo.eliminated ? 'Eliminated' : 'Active'}</div>
            </div>
          </div>
        ))}
      </div>

      {visiblePhotos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: '#999' }}>No photos to display at this tournament level</p>
        </div>
      )}
    </div>
  );
}