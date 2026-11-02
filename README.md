# Jellyfin Profanity Filter Plugin

A powerful Jellyfin plugin that filters profanity during media playback using real-time speech-to-text and local AI models. This plugin transcribes audio from live streams, detects profanity using a local LLM, and automatically mutes or skips filtered content.

![Jellyfin](https://img.shields.io/badge/Jellyfin-512457?logo=jellyfin&style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-green?style=for-the-badge)

## Features

- **Real-time Audio Transcription**: Uses Whisper.cpp for efficient, CPU-optimized speech-to-text
- **Local AI Profanity Detection**: Runs Phi-2 or TinyLlama locally for privacy and customization
- **Pattern-based Word Matching**: Supports variations like F#ck, G#d, D##n with customizable patterns
- **Dual Action Modes**: Mute (pause playback) and Skip (delayed resume) options
- **Jellyfin API Integration**: Works seamlessly with Jellyfin's existing transcoding infrastructure
- **User-friendly Web UI**: Easy-to-use interface for managing filtered words and settings

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

## Requirements

### System Requirements

- **Operating System**: Windows 10/11, Linux (Ubuntu 20.04+), or macOS
- **RAM**: Minimum 8GB (16GB recommended for optimal performance)
- **Disk Space**: 
  - Plugin code: ~50MB
  - Phi-2 model: ~2GB (compressed GGUF format)
  - TinyLlama alternative: ~1.3GB (optional)
- **CPU**: Modern multi-core processor (Intel/AMD with AVX2 support recommended)

### Dependencies

- Node.js 18+ and npm 9+
- Jellyfin media server (10.8+)
- Whisper.cpp binaries (included via npm)
- GGUF model files (downloaded separately)

## Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/jellyfin-profanity-filter.git
cd jellyfin-profanity-filter
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required npm packages including:
- `@jellyfin/sdk` - Jellyfin API client
- `typescript` - Type checking and compilation
- `react` & `react-dom` - UI components
- Test dependencies for development

### Step 3: Download AI Models

You need to download the GGUF model files. Choose one of the following:

#### Option A: Phi-2 (Recommended)

```bash
# Download Phi-2 GGUF model (~2GB)
mkdir -p models
cd models

# Using wget (Linux/macOS)
wget https://huggingface.co/microsoft/Phi-2/resolve/main/ggml-phi-2-f16.gguf

# Or using curl
curl -L -o ggml-phi-2-f16.gguf https://huggingface.co/microsoft/Phi-2/resolve/main/ggml-phi-2-f16.gguf

# Verify download
ls -lh ggml-phi-2-f16.gguf
```

#### Option B: TinyLlama (Lighter Alternative)

```bash
# Download TinyLlama GGUF model (~1.3GB)
cd models

wget https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0/resolve/main/ggml-model-q4_k_m.gguf
```

### Step 4: Build the Plugin

```bash
npm run build
```

This will:
1. Compile TypeScript code
2. Bundle React components
3. Copy all files to the plugins directory

The built plugin will be in `plugins/jellyfin-profanity-filter/`

### Step 5: Install in Jellyfin

1. **Stop Jellyfin** (if running)
2. **Copy the plugin folder** to your Jellyfin plugins directory:
   ```bash
   # Windows
   copy /D plugins\jellyfin-profanity-filter "C:\Program Files\Jellyfin\server\plugins\"
   
   # Linux
   cp -r plugins/jellyfin-profanity-filter /var/lib/jellyfin-server/plugins/
   
   # macOS
   cp -r plugins/jellyfin-profanity-filter /Applications/Jellyfin.app/Contents/Resources/app/server/plugins/
   ```

3. **Start Jellyfin** and navigate to: `Dashboard → Manage → Plugins`
4. **Enable the plugin** and click "Install"
5. **Restart Jellyfin** if prompted

## Configuration

### Plugin Settings

After enabling the plugin, access the configuration via:
- **URL**: `http://<jellyfin-server>/plugins/jellyfin-profanity-filter/`
- Or through Jellyfin Dashboard → Manage → Plugins → Profanity Filter

#### Global Settings

| Setting | Description | Default |
|---------|-------------|---------|
| Enable Filter | Toggle the profanity filter on/off | `true` |
| Confidence Threshold | Minimum confidence for detection (0.1 - 1.0) | `0.5` |
| Action on Profanity | Choose between mute, skip, or both | `both` |

#### Word Manager

Add custom words to filter:
- Enter a word with variations (e.g., `F#ck`, `G#d`, `D##n`)
- Select category: Custom, Slang, Explicit, or Offensive
- Toggle enabled/disabled status for each word
- Delete unwanted entries

### Model Configuration

Edit `src/utils/config.ts` to customize model settings:

```typescript
export const config: PluginConfig = {
  // Model path (must match downloaded file)
  modelPath: 'models/ggml-phi-2-f16.gguf',
  
  // Model type
  modelType: 'phi-2', // or 'tinyllama'
  
  // Inference settings
  contextSize: 4096,      // Context window size
  nBatch: 512,            // Batch size for inference
  nThreads: 4,            // CPU threads to use
  
  // Performance settings
  maxInferenceTime: 100,  // Max ms per inference (lower = faster)
  fallbackThreshold: 2.0, // Seconds before switching to binary classifier
};
```

## Usage

### Basic Workflow

1. **Start Playing Media**: Begin playback of any media in Jellyfin
2. **Audio Capture Begins**: The plugin automatically captures audio from the live stream
3. **Real-time Transcription**: Whisper.cpp transcribes audio chunks (1-second intervals)
4. **Profanity Detection**: Phi-2 analyzes each transcription for profanity
5. **Automatic Action**: When profanity is detected:
   - **Mute**: Pauses playback immediately
   - **Skip**: Delays resume by the duration of the profane word
6. **Resume Playback**: Automatically resumes after the filtered content

### Advanced Usage

#### Custom Word Lists

Create a custom word list file `models/custom-words.txt`:

```
F#ck
G#d
D##n
S#t
W@ts
hell
damn
crap
shit
bitch
asshole
fuck
bastard
```

The plugin will automatically load this file on startup.

#### Multiple Model Support

To use both models for comparison:

1. Download both Phi-2 and TinyLlama models
2. Update `config.ts` to specify preferred model
3. The system will automatically fall back to the secondary model if the primary fails

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/transcode-hook` | POST | Handle transcoding events |
| `/api/filter-status` | GET | Get current filter status |
| `/api/playback-control/pause` | POST | Manually pause playback |
| `/api/playback-control/resume` | POST | Manually resume playback |

### Endpoint Details

#### Filter Status (`GET /api/filter-status`)

Returns current filter state:

```json
{
  "enabled": true,
  "confidenceThreshold": 0.5,
  "actionOnProfanity": "both",
  "modelType": "phi-2",
  "wordsCount": 15,
  "isProcessing": false,
  "lastDetectionTime": null
}
```

#### Playback Control (`POST /api/playback-control/pause`)

Manually pause playback:

```json
{
  "success": true,
  "message": "Playback paused successfully"
}
```

## Troubleshooting

### Model Loading Issues

**Error**: `Failed to load model: ENOENT`

**Solution**: Verify the model file exists and is accessible:
```bash
# Check file exists
ls -lh models/ggml-phi-2-f16.gguf

# Check permissions
chmod 644 models/ggml-phi-2-f16.gguf
```

### Performance Issues

**Symptom**: High CPU usage or slow detection

**Solutions**:
1. Reduce `nThreads` in config (try 2 instead of 4)
2. Reduce `contextSize` to 2048
3. Increase `maxInferenceTime` to 200ms
4. Use TinyLlama instead of Phi-2

### No Audio Being Captured

**Symptom**: Filter detects nothing even with audio playing

**Solutions**:
1. Verify media is being transcoded (not direct play)
2. Check Jellyfin logs for transcoder errors
3. Ensure plugin has permission to access audio streams

### Memory Issues

**Symptom**: System crashes or OOM errors

**Solutions**:
1. Close other applications to free RAM
2. Use TinyLlama instead of Phi-2 (smaller model)
3. Reduce batch size in config

## Development

### Project Structure

```
jellyfin-profanity-filter/
├── src/
│   ├── core/              # Core filtering logic
│   │   ├── filterEngine.ts    # Main filter engine
│   │   ├── wordMatcher.ts     # Pattern matching
│   │   └── actionHandler.ts   # Mute/skip actions
│   ├── stt/               # Speech-to-text
│   │   ├── audioProcessor.ts  # Audio stream handling
│   │   └── whisperService.ts  # Whisper.cpp integration
│   ├── llm/               # LLM integration
│   │   ├── phi2Service.ts     # Phi-2 GGUF loading
│   │   └── profanityClassifier.ts  # Text classification
│   ├── optimization/      # Performance optimization
│   │   └── modelOptimization.ts
│   ├── api/endpoints/     # REST API endpoints
│   ├── ui/                # React UI components
│   └── utils/             # Utilities and config
├── tests/                 # Unit tests
├── models/                # AI model files
├── plugins/               # Built plugin output
└── package.json           # Dependencies
```

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

This creates the distributable in `plugins/jellyfin-profanity-filter/`

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

- **GitHub Issues**: [Open an issue](https://github.com/yourusername/jellyfin-profanity-filter/issues)
- **Documentation**: See README.md for detailed usage instructions
- **Model Sources**: 
  - Phi-2: https://huggingface.co/microsoft/Phi-2
  - TinyLlama: https://huggingface.co/TinyLlama

## Acknowledgments

- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) for efficient speech-to-text
- [Microsoft Phi-2](https://huggingface.co/microsoft/Phi-2) for the LLM model
- [Jellyfin](https://jellyfin.org/) for the media server platform
