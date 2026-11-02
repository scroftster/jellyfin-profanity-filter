# Jellyfin Profanity Filter Plugin

A powerful Jellyfin plugin that filters profanity during media playback using real-time speech-to-text and local AI models.

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────────────┐     ┌─────────────────┐
│  Jellyfin       │────▶│  Profanity Filter AI    │◀───│  Audio Stream   │
│  Plugin         │     │  Service (Docker)       │     │  from Playback  │
└─────────────────┘     └─────────────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  Whisper.cpp STT     │
                    └──────────────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  Phi-2/TinyLlama     │
                    │  Profanity Classifier│
                    └──────────────────────┘
```

## Quick Start (Unraid Docker)

### Prerequisites

- Unraid server with Docker installed
- Jellyfin media server running
- At least 8GB RAM available
- Internet connection for initial model download (~3.3GB total)

### Step 1: Clone Both Repositories

```bash
# Clone the plugin repository
git clone https://github.com/scroftster/jellyfin-profanity-filter.git
cd jellyfin-profanity-filter

# Clone the AI service repository
git clone https://github.com/scroftster/jellyfin-profanity-filter-ai.git
cd ../jellyfin-profanity-filter-ai
```

### Step 2: Build the AI Service Docker Image

The AI service container includes both models (Phi-2 and TinyLlama) pre-downloaded.

```bash
# Build the AI service image
docker build -t jellyfin-profanity-filter-ai .

# Verify build completed successfully
docker images | grep jellyfin-profanity-filter-ai
```

### Step 3: Create Models Directory on Unraid

Create a persistent location for model files (outside Docker):

```bash
# On Unraid, create models directory
mkdir -p /mnt/user/appdata/jellyfin-ai/models

# Verify the directory exists
ls -lh /mnt/user/appdata/jellyfin-ai/
```

### Step 4: Run the AI Service Container

```bash
docker run -d \
  --name jellyfin-profanity-filter-ai \
  --net host \
  -v /mnt/user/appdata/jellyfin-ai/models:/app/models:ro \
  -e MODEL_PATH=/app/models/ggml-phi-2-f16.gguf \
  -e MODEL_TYPE=phi-2 \
  -e CONFIDENCE_THRESHOLD=0.5 \
  -e AUDIO_CHUNK_SIZE=1000 \
  jellyfin-profanity-filter-ai
```

### Step 5: Verify AI Service is Running

```bash
# Check container status
docker ps | grep jellyfin-profanity-filter-ai

# View logs to confirm models loaded
docker logs -f jellyfin-profanity-filter-ai
```

Expected output should include:
```
Phi-2 model downloaded successfully
TinyLlama model downloaded successfully
AI Service initialized successfully
```

### Step 6: Build the Jellyfin Plugin

```bash
cd ../jellyfin-profanity-filter
npm install
npm run build
```

### Step 7: Install Plugin in Jellyfin

```bash
# Stop Jellyfin service
jellyfin-stop

# Copy plugin to Jellyfin plugins directory
copy /D plugins\jellyfin-profanity-filter "C:\Program Files\Jellyfin\server\plugins\"

# Start Jellyfin
jellyfin-start
```

### Step 8: Configure Plugin in Jellyfin Dashboard

1. Open Jellyfin web interface
2. Navigate to **Dashboard → Manage → Plugins**
3. Find "Profanity Filter" and click **Install**
4. Click **Settings** to configure:
   - **AI Model**: Select Phi-2 or TinyLlama from dropdown
   - **Confidence Threshold**: Set between 0.1-1.0 (default: 0.5)
   - **Action on Profanity**: Choose Mute, Skip, or Both

## Model Selection

The plugin includes a dropdown to select between the two models:

| Model | Size | Use Case |
|-------|------|----------|
| **Phi-2** | ~2GB | High accuracy, recommended for most setups |
| **TinyLlama** | ~1.3GB | Lightweight, for lower-end hardware |

Both models are included in the AI Docker container and automatically available for selection.

## Automatic Model Updates

When the AI Docker container is updated:

1. The container checks for newer model versions on HuggingFace
2. If updates are found, it downloads them automatically
3. The Jellyfin plugin detects the new models on next restart
4. Select the updated model from the dropdown in plugin settings

### Update Check Endpoint

```bash
curl http://localhost:3000/api/model-check
```

Response:
```json
{
  "phi2": {
    "currentVersion": "1.0",
    "latestVersion": "1.1",
    "updateAvailable": true
  },
  "tinyllama": {
    "currentVersion": "1.0",
    "latestVersion": "1.0",
    "updateAvailable": false
  }
}
```

### Manual Update

```bash
# Stop the container
docker stop jellyfin-profanity-filter-ai

# Pull latest image (if using Docker Hub)
docker pull scroftster/jellyfin-profanity-filter-ai:latest

# Or rebuild with updated models
cd jellyfin-profanity-filter-ai
docker build --pull -t jellyfin-profanity-filter-ai .

# Start container
docker start jellyfin-profanity-filter-ai
```

## Configuration Options

### Plugin Settings (Jellyfin Dashboard)

| Setting | Options | Default |
|---------|---------|---------|
| AI Model | Phi-2, TinyLlama | Phi-2 |
| Confidence Threshold | 0.1 - 1.0 | 0.5 |
| Action on Profanity | Mute, Skip, Both | Both |

### Environment Variables (Docker)

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_PATH` | `/app/models/ggml-phi-2-f16.gguf` | Path to GGUF model file |
| `MODEL_TYPE` | `phi-2` | Model type: `phi-2` or `tinyllama` |
| `CONFIDENCE_THRESHOLD` | `0.5` | Minimum confidence for detection |
| `AUDIO_CHUNK_SIZE` | `1000` | Audio chunk size in ms |

## API Endpoints

### Check Filter Status

```bash
curl http://localhost:3000/api/filter-status
```

Response:
```json
{
  "enabled": true,
  "confidenceThreshold": 0.5,
  "modelType": "phi-2",
  "wordsCount": 8,
  "isProcessing": false
}
```

### Check Model Updates

```bash
curl http://localhost:3000/api/model-check
```

Response:
```json
{
  "phi2": {
    "currentVersion": "1.0",
    "latestVersion": "1.1",
    "updateAvailable": true,
    "downloadUrl": "https://huggingface.co/..."
  },
  "tinyllama": {
    "currentVersion": "1.0",
    "latestVersion": "1.0",
    "updateAvailable": false
  }
}
```

## Troubleshooting

### Model Not Found Error

```bash
# Verify models exist in container
docker exec jellyfin-profanity-filter-ai ls -lh /app/models/

# If missing, rebuild with models downloaded
cd jellyfin-profanity-filter-ai
docker build --pull -t jellyfin-profanity-filter-ai .
```

### Plugin Can't Connect to AI Service

1. Verify AI service is running: `docker ps`
2. Check network mode: should be `host` for local communication
3. Verify environment variables in docker run command

### Slow Inference

```bash
# Increase CPU threads
docker update --cpu-shares=512 jellyfin-profanity-filter-ai

# Or use smaller model quantization
# Edit Dockerfile to download q4_k_m instead of f16
```

## Repository Structure

```
jellyfin-profanity-filter/          # Jellyfin plugin (inside container)
├── src/                            # Plugin source code
│   ├── core/                      # Filter engine, word matcher, action handler
│   ├── api/                       # API endpoints
│   └── ui/                        # React UI components
└── package.json                   # Dependencies

jellyfin-profanity-filter-ai/       # AI service (separate Docker container)
├── src/                           # AI service source code
│   ├── core/                     # Filter engine, word matcher, action handler
│   ├── llm/                      # Phi-2/TinyLlama integration
│   ├── stt/                      # Whisper.cpp STT
│   └── modelUpdater.ts           # Model update logic
├── Dockerfile                    # Container build instructions (includes models)
├── docker-compose.yml            # Alternative deployment config
└── README.md                     # AI service documentation
```

## License

MIT License - See LICENSE file for details.
