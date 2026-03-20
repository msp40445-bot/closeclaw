# Closeclaw

A private, local AI assistant for macOS. Runs entirely on-device with Metal GPU acceleration — no cloud, no API keys, complete privacy.

## Prerequisites

- **macOS** (Apple Silicon M1/M2/M3 recommended, Intel also supported)
- **Node.js 22+** — install via [nvm](https://github.com/nvm-sh/nvm) or [Homebrew](https://brew.sh):
  ```bash
  brew install node@22
  ```
  If you already have another Node version linked, make sure Node 22 is in your PATH:
  ```bash
  echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```
- **CMake** (required to build the AI engine):
  ```bash
  brew install cmake
  ```

## Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/msp40445-bot/closeclaw.git
   cd closeclaw
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This will also compile `node-llama-cpp` with Metal support on Apple Silicon.

3. **Run in development mode:**
   ```bash
   npm run dev
   ```
   This starts the Vite dev server and opens the Electron app with hot reload.

4. **On first launch**, the app will prompt you to download the AI model (~2.3 GB). Click "Download Model" and wait for it to finish. The model is stored in `~/Library/Application Support/closeclaw/models/`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the app in development mode with hot reload |
| `npm run build` | Build the renderer and Electron main process |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run package` | Package the app as a macOS universal binary (dmg + zip) |
| `npm run release` | Build + package in one step |

## Building a Release

To create a distributable macOS app:

```bash
npm run release
```

The output will be in `release/<version>/` — a `.dmg` installer and `.zip` archive, both as universal binaries (arm64 + x64).

## Auto-Update

The app checks for updates from [GitHub Releases](https://github.com/msp40445-bot/closeclaw/releases) automatically:

- On launch (after a 3-second delay)
- Every 30 minutes while running

When a new version is available, an update banner appears at the top of the app. Click "Download Update" and then "Restart & Update" to apply.

### Publishing a new release

1. Bump the version in `package.json`
2. Commit and push to `main`
3. Tag and push:
   ```bash
   git tag v0.2.0
   git push origin v0.2.0
   ```
4. GitHub Actions will build the macOS universal app and publish it as a GitHub Release
5. All running Closeclaw instances will detect the update automatically

## Architecture

```
closeclaw/
├── electron/
│   ├── main.ts          # Electron main process, window management, IPC
│   ├── preload.ts       # Context bridge — exposes safe APIs to the renderer
│   ├── updater.ts       # Auto-update via electron-updater + GitHub Releases
│   └── llm-engine.ts    # Local AI: model download, loading, and inference
├── src/
│   ├── App.tsx           # Root component — routes between setup and chat
│   ├── components/
│   │   ├── ChatView.tsx      # Chat interface with streaming responses
│   │   ├── ModelSetup.tsx    # Model download and loading screen
│   │   └── UpdateBanner.tsx  # Update notification banner
│   └── env.d.ts          # TypeScript declarations for window.closeclaw API
├── .github/workflows/
│   ├── ci.yml            # Lint + typecheck on PRs
│   └── release.yml       # Build + publish on version tags
└── electron-builder.yml  # macOS universal binary packaging config
```

## Tech Stack

- **Electron** — desktop app runtime
- **React + TypeScript + Vite** — frontend UI with hot reload
- **node-llama-cpp** — llama.cpp bindings for Node.js with Metal GPU acceleration
- **electron-updater** — auto-update from GitHub Releases
- **electron-builder** — macOS universal binary packaging
- **GitHub Actions** — CI/CD pipeline

## AI Model

The app uses **Phi-3 Mini (Q4 quantized, ~2.3 GB)** by default, which runs well on M1 Macs with 8 GB RAM. The model is downloaded on first launch and cached locally.

All inference happens on-device using Metal GPU acceleration — no internet connection needed after the initial model download.

## License

MIT
