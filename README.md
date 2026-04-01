# 🎙️ Pocket TTS API Server

Express.js API server for text-to-speech using [pocket-tts](https://github.com/umairzahid604/pocket-tts). The TTS model is pre-loaded into memory on server startup for fast generation (~600-800ms per request).

## ✨ Features

- 🚀 **Fast** - Model loads once at startup, all generations are fast
- 🎭 **8 Built-in Voices** - alba, marius, javert, jean, fantine, cosette, eponine, azelma
- � **Custom Voices** - Add your own voice files in `voices/` folder (automatically detected)
- �🔊 **Audio Effects** - Adjust volume (0-2x) and playback speed (0.5-2x)
- 📦 **Multiple Response Formats** - File download, Base64, or streaming
- 🔄 **Auto Cleanup** - Temporary files are automatically cleaned
- 💚 **Health Checks** - Monitor server and model status

## 📋 Requirements

- Node.js >= 18.0.0
- Python 3.10 - 3.14
- FFmpeg (for audio processing)

## 🚀 Installation

1. **Clone the repository:**
   ```bash
   cd pocket-tts-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: Python package `pocket-tts` will be installed automatically during npm install.*

3. **Create environment file:**
   ```bash
   copy .env.example .env
   ```

4. **Edit `.env` file if needed:**
   ```env
   PORT=3000
   ```

## ▶️ Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will:
1. Load the TTS model into memory (~12 seconds on first load)
2. Start the Express server
3. Display available endpoints

## 📡 API Endpoints

### Python API Compatible Endpoints

Yeh endpoints Python FastAPI server ke bilkul same hain - existing clients ke liye backward compatibility.

#### 1. Get Voices List (Python Compatible)
**GET** `/getvoiceslist`

Get list of all available voices.

**Response:**
```json
{
  "voices": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma", "custom1"],
  "default": "alba",
  "total": 9
}
```

#### 2. Generate TTS (Python Compatible)
**POST** `/generate`

Generate TTS audio file.

**Request Body:**
```json
{
  "text": "Hello world!",
  "voice": "alba"
}
```

**Response:**
- Returns WAV audio file directly
- Headers include:
  - `X-Word-Count`: Number of words in text
  - `X-Voice-Used`: Voice name used
  - `Content-Type`: audio/wav

---

### REST API Endpoints

### 1. Health Check
**GET** `/health`

Check if server and TTS model are ready.

**Response:**
```json
{
  "success": true,
  "status": "running",
  "ttsReady": true,
  "timestamp": "2026-04-01T12:00:00.000Z"
}
```

---

### 2. Get Available Voices (REST)
**GET** `/api/tts/voices`

Get list of available built-in and custom voices with detailed info.

**Response:**
```json
{
  "success": true,
  "voices": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma", "custom1"],
  "count": 9,
  "builtin": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma"],
  "custom": ["custom1"]
}
```

---

### 3. Generate TTS (REST - File or Base64)
**POST** `/api/tts/generate`

Generate text-to-speech audio.

**Request Body:**
```json
{
  "text": "Hello world!",
  "voice": "alba",
  "volume": 1.0,
  "playbackSpeed": 1.0,
  "format": "file"
}
```

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| text | string | ✅ Yes | - | Text to convert to speech |
| voice | string | ❌ No | "alba" | Voice name or path to audio file for cloning |
| volume | number | ❌ No | 1.0 | Volume level (0.0 - 2.0) |
| playbackSpeed | number | ❌ No | 1.0 | Playback speed (0.5 - 2.0) |
| format | string | ❌ No | "file" | Response format: "file" or "base64" |

**Response (format: "file"):**
- Returns WAV audio file for download

**Response (format: "base64"):**
```json
{
  "success": true,
  "audio": "UklGRiQAAABXQVZFZm10...",
  "mimeType": "audio/wav",
  "generationTimeMs": 650,
  "metadata": {
    "text": "Hello world!",
    "voice": "alba",
    "volume": 1.0,
    "playbackSpeed": 1.0
  }
}
```

---

### 4. Generate TTS (Streaming)
**POST** `/api/tts/generate-stream`

Generate and stream TTS audio directly.

**Request Body:**
```json
{
  "text": "Hello world!",
  "voice": "alba",
  "volume": 1.0,
  "playbackSpeed": 1.0
}
```

**Response:**
- Streams WAV audio file with `Content-Type: audio/wav`

---

## 🧪 Example Usage

### Using cURL

**Basic TTS generation:**
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello, this is a test!\"}" \
  --output output.wav
```

**With voice and effects:**
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello world!\", \"voice\": \"marius\", \"volume\": 1.5, \"playbackSpeed\": 1.2}" \
  --output output.wav
```

**Get Base64 audio:**
```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello!\", \"format\": \"base64\"}"
```

### Using JavaScript (Fetch)

```javascript
async function generateTTS() {
  const response = await fetch('http://localhost:3000/api/tts/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Hello from JavaScript!',
      voice: 'alba',
      volume: 1.2,
      playbackSpeed: 1.0,
      format: 'base64'
    })
  });

  const data = await response.json();
  
  if (data.success) {
    // Play audio from base64
    const audio = new Audio(`data:${data.mimeType};base64,${data.audio}`);
    audio.play();
  }
}

generateTTS();
```

### Using Python (requests)

```python
import requests

url = "http://localhost:3000/api/tts/generate"
payload = {
    "text": "Hello from Python!",
    "voice": "alba",
    "volume": 1.0,
    "playbackSpeed": 1.0
}

response = requests.post(url, json=payload)

# Save audio file
with open("output.wav", "wb") as f:
    f.write(response.content)
```

## 🎭 Available Voices

### Built-in Voices:
- **alba** - Default voice
- **marius**
- **javert**
- **jean**
- **fantine**
- **cosette**
- **eponine**
- **azelma**

### Custom Voices:
Aap apni custom voice files `voices/` folder mein rakh sakte hain. Server automatically un voices ko detect kar lega.

**How to add custom voices:**
1. Apni WAV file ko `voices/` folder mein copy karein
2. File ka name (without `.wav` extension) as voice parameter use karein

**Example:**
```bash
# Step 1: Copy your voice file
cp myvoice.wav voices/

# Step 2: Use it in API
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello!", "voice": "myvoice"}' \
  --output output.wav
```

**Check all available voices:**
```bash
curl http://localhost:3000/api/tts/voices
```

Response will include both built-in and custom voices:
```json
{
  "success": true,
  "voices": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma", "myvoice"],
  "count": 9,
  "builtin": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma"],
  "custom": ["myvoice"]
}
```

## 🔧 Voice Cloning

To use voice cloning, you need to:

1. Accept terms at: https://huggingface.co/kyutai/pocket-tts
2. Login with: `uvx hf auth login`

Then use a path to your audio file (5-30 seconds WAV) as the voice parameter:

```json
{
  "text": "This is my cloned voice!",
  "voice": "./path/to/voice-sample.wav"
}
```

## ⚙️ Configuration

Edit the `.env` file to change settings:

```env
# Server port
PORT=3000
```

## 🛠️ Error Handling

The API returns detailed error messages:

**Example error response:**
```json
{
  "success": false,
  "error": "Text is required and must be a non-empty string"
}
```

**Common errors:**
| Error Code | Description |
|------------|-------------|
| 400 | Bad request (invalid parameters) |
| 503 | TTS model is still loading |
| 500 | Server error during generation |

## 🧹 Automatic Cleanup

- Temporary audio files are automatically deleted after being sent
- Files older than 5 minutes are cleaned up automatically
- All temp files are cleaned on server shutdown

## 📊 Performance

- **First generation**: ~12 seconds (includes model loading)
- **Subsequent generations**: ~600-800ms
- **Model**: 100M parameter model optimized for CPU

## 🔌 Graceful Shutdown

The server handles graceful shutdown on:
- `CTRL+C` (SIGINT)
- `SIGTERM`

This ensures:
- Cleanup of temporary files
- Proper closure of TTS instance
- No orphaned processes

## 📝 License

MIT

## 🙏 Credits

- [Kyutai Labs](https://kyutai.org/) - Pocket-TTS model
- [pocket-tts](https://github.com/umairzahid604/pocket-tts) - Original implementation

## 🆘 Support

If you encounter issues:

1. Check Python version: `python --version` (should be 3.10-3.14)
2. Check Node version: `node --version` (should be >= 18.0.0)
3. Ensure FFmpeg is installed
4. Check server logs for detailed error messages

For voice cloning issues, ensure you've accepted HuggingFace terms and logged in via `uvx hf auth login`.
