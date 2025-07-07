# Photo Tournament

A TypeScript-based photo tournament prototype that uses AI to judge photos and progressively eliminate them in tournament-style rounds.

## Features

- **AI-Powered Judging**: Uses OpenRouter API with Claude 3.5 Sonnet to judge photo pairs
- **Multiple Tournament Algorithms**: Supports pairwise, n-wise, and ELO-based elimination
- **Interactive Web Viewer**: Next.js app with slider to view tournament progression
- **CLI Interface**: Command-line tool for running tournaments
- **Persistent Results**: JSON snapshots saved after each round

## Project Structure

```
/photos/              ← Drop JPEG files here
/src/
  tournament/
    types.ts         ← Core interfaces
    bracket.ts       ← Tournament algorithms
  scoring/
    openrouter.ts    ← AI judging via OpenRouter
  cli/
    run-tournament.ts ← CLI runner
/web/                 ← Next.js 15 app (app router)
/results/             ← JSON snapshots (git-ignored)
.env.local           ← OPENROUTER_API_KEY=...
```

## Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment**:
   Create `.env.local` with your OpenRouter API key:

   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Add photos**:
   Drop JPEG/PNG files into the `photos/` directory, or organize them into subdirectories for separate tournaments:
   ```
   photos/
     dayone/          ← First tournament group
       photo1.jpg
       photo2.jpg
     daytwo/          ← Second tournament group
       photo3.jpg
       photo4.jpg
   ```

## Usage

### Running a Tournament

**List available photo groups**:

```bash
npm run tournament:demo -- --list-groups
```

**Basic tournament with default settings** (requires specifying a group if subdirectories exist):

```bash
npm run tournament:demo -- --group dayone
```

**Tournament with specific group in JSON config**:

```bash
npm run tournament:demo '{"group": "dayone", "algorithm": "elo", "rounds": 5}'
```

**Custom tournament configuration**:

```bash
npm run tournament:demo '{"algorithm": "elo", "rounds": 5, "model": "anthropic/claude-3.5-sonnet", "eliminationRate": 0.3, "group": "daytwo"}'
```

**CLI Options**:

- `--dry-run`: Test run without API calls
- `--resume`: Resume from last saved round
- `--group <name>`: Specify photo group (overrides JSON config)
- `--list-groups`: List available photo groups

### Tournament Algorithms

**Pairwise**: Eliminates bottom performers based on score rankings

```json
{
  "algorithm": "pairwise",
  "rounds": 3,
  "eliminationRate": 0.5
}
```

**N-wise**: Groups photos and eliminates worst from each group

```json
{
  "algorithm": "nwise",
  "rounds": 4,
  "batchSize": 4,
  "eliminationRate": 0.25
}
```

**ELO**: Uses ELO rating system with simulated matches

```json
{
  "algorithm": "elo",
  "rounds": 3,
  "eliminationRate": 0.3
}
```

### Web Viewer

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the tournament results.

**Features**:

- **Slider Control**: Adjust to show photos from different tournament rounds
- **Photo Grid**: Time-sorted display of surviving photos
- **Real-time Updates**: Automatically refreshes as tournament progresses
- **Photo Details**: Shows score, round, and elimination status

## API Integration

The app uses OpenRouter API to access Claude 3.5 Sonnet for photo judging:

```typescript
const judgment = await judgePair(
  "/path/to/photo1.jpg",
  "/path/to/photo2.jpg",
  "anthropic/claude-3.5-sonnet"
);
```

**Response format**:

```json
{
  "winner": "a",
  "explanation": "Better composition and lighting"
}
```

## Testing

Run the test suite:

```bash
npm test
```

Tests cover:

- Tournament bracket algorithms
- Edge cases (single photo, empty arrays)
- Elimination logic
- Score updates

## Development

**Build the project**:

```bash
npm run build
```

**Lint the code**:

```bash
npm run lint
```

**Project Dependencies**:

- **Runtime**: Next.js 15, React 18, TypeScript, node-fetch, SWR
- **Development**: ts-node, Jest, ESLint, TypeScript types

## Tournament Results

Results are saved as JSON files in `results/`:

- `round-1.json`, `round-2.json`, etc.
- Contains photo scores, elimination status, and metadata
- Git-ignored to avoid committing large result files

## Configuration Options

| Parameter         | Type   | Default                         | Description                     |
| ----------------- | ------ | ------------------------------- | ------------------------------- |
| `algorithm`       | string | `"pairwise"`                    | Tournament algorithm            |
| `rounds`          | number | `3`                             | Number of elimination rounds    |
| `model`           | string | `"anthropic/claude-3.5-sonnet"` | AI model for judging            |
| `eliminationRate` | number | `0.5`                           | Fraction of photos to eliminate |
| `batchSize`       | number | `4`                             | Group size for n-wise algorithm |
| `group`           | string | `undefined`                     | Photo group subdirectory to use |

## Troubleshooting

**No photos found**: Make sure JPEG/PNG files are in the `photos/` directory or specified group subdirectory.

**Multiple groups found**: Use `--list-groups` to see available groups, then specify one with `--group` or in the config JSON.

**API errors**: Verify `OPENROUTER_API_KEY` is set in `.env.local`.

**Build errors**: Run `npm install` to ensure all dependencies are installed.

**Port conflicts**: The dev server uses port 3000 by default. Use `npm run dev -- -p 3001` to use a different port.

## License

MIT License - see LICENSE file for details.
