# 🎙️ Voice Generation API

Node.js API server for text-to-speech using [pocket-tts](https://github.com/umairzahid604/pocket-tts). Python FastAPI compatible endpoints with pre-loaded model for fast generation.

## ✨ Features

- 🚀 **Fast** - Model loads once at startup, all generations are fast (~600-800ms)
- 🎭 **8 Built-in Voices** - alba, marius, javert, jean, fantine, cosette, eponine, azelma
- 📂 **Custom Voices** - Add your own WAV files in `voices/` folder (auto-detected)
- 🐍 **Python Compatible** - Same API structure as Python FastAPI server
- 🔄 **Auto Cleanup** - Temporary files are automatically cleaned
- 💚 **Health Checks** - Monitor server status

## 📋 Requirements

- Node.js >= 18.0.0
- Python 3.10 - 3.14
- FFmpeg (for audio processing)

## 🚀 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: Python package `pocket-tts` will be installed automatically during npm install.*

2. **Create environment file:**
   ```bash
   copy .env.example .env
   ```

3. **Configure port (optional):**
   ```env
   PORT=8547
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
2. Start listening on port 8547
3. Display available voices

## 📡 API Endpoints

### 1. Root Endpoint
**GET** `/`

Get API information.

**Response:**
```json
{
  "message": "Voice Generation API",
  "status": "running"
}
```

---

### 2. Health Check
**GET** `/health`

Check server health.

**Response:**
```json
{
  "status": "healthy"
}
```

---

### 3. Get Voices List
**GET** `/getvoiceslist`

Get list of all available voices (built-in + custom).

**Response:**
```json
{
  "voices": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma", "myvoice"],
  "default": "alba",
  "total": 9
}
```

---

### 4. Generate TTS
**POST** `/generate`

Generate text-to-speech audio file.

**Request Body:**
```json
{
  "text": "Hello world!",
  "voice": "alba"
}
```

**Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| text | string | ✅ Yes | - | Text to convert to speech |
| voice | string | ❌ No | "alba" | Voice name from available voices |

**Response:**
- Returns WAV audio file directly
- **Headers:**
  - `Content-Type`: audio/wav
  - `Content-Disposition`: attachment; filename=generated.wav
  - `X-Word-Count`: Number of words in text
  - `X-Chunks-Count`: Number of chunks processed
  - `X-Voice-Used`: Voice name used

**Error Response:**
```json
{
  "detail": "Text is required"
}
```

---

## 🧪 Example Usage

### Using cURL

**Basic TTS generation:**
```bash
curl -X POST http://localhost:8547/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello, this is a test!\"}" \
  --output output.wav
```

**With specific voice:**
```bash
curl -X POST http://localhost:8547/generate \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Hello world!\", \"voice\": \"marius\"}" \
  --output output.wav
```

**Get voices list:**
```bash
curl http://localhost:8547/getvoiceslist
```

### Using JavaScript (Node.js)

```javascript
const fs = require('fs');

async function generateTTS() {
  const response = await fetch('http://localhost:8547/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Hello from JavaScript!',
      voice: 'alba'
    })
  });

  if (response.ok) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync('output.wav', buffer);
    console.log('Audio saved to output.wav');
  }
}

generateTTS();
```

### Using Python (requests)

```python
import requests

url = "http://localhost:8547/generate"
payload = {
    "text": "Hello from Python!",
    "voice": "alba"
}

response = requests.post(url, json=payload)

if response.status_code == 200:
    with open("output.wav", "wb") as f:
        f.write(response.content)
    print("Audio saved to output.wav")
else:
    print("Error:", response.json())
```

### Test Script

Run the included test script:
```bash
node test-generate-save.js
```

This will generate and save `test-output.wav`.

## 🎭 Available Voices

### Built-in Voices:
- **alba** (default)
- **marius**
- **javert**
- **jean**
- **fantine**
- **cosette**
- **eponine**
- **azelma**

### Custom Voices:

Add your own voice files to the `voices/` folder. The server will automatically detect them.

**How to add:**

1. Copy your WAV file to `voices/` folder:
   ```bash
   copy myvoice.wav voices\
   ```

2. Use the voice name (without extension):
   ```bash
   curl -X POST http://localhost:8547/generate \
     -H "Content-Type: application/json" \
     -d "{\"text\": \"Hello!\", \"voice\": \"myvoice\"}" \
     --output output.wav
   ```

3. Verify it's available:
   ```bash
   curl http://localhost:8547/getvoiceslist
   ```

**Requirements for custom voices:**
- Format: WAV only
- Duration: 5-30 seconds recommended for voice cloning
- No special characters in filename

## ⚙️ Configuration

Edit `.env` file:

```env
# Server port
PORT=8547
```

## 🛠️ Error Handling

**Error Response Format:**
```json
{
  "detail": "Error message here"
}
```

**Common Errors:**

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Text is required | Empty or missing text field |
| 400 | Voice 'X' not found | Invalid voice name |
| 500 | Internal server error | Server or model error |

## 🧹 Automatic Cleanup

- Temporary audio files deleted after sending
- Files older than 5 minutes auto-cleaned
- Cleanup on server shutdown

## 📊 Performance

- **First generation**: ~12 seconds (includes model loading on startup)
- **Subsequent generations**: ~600-800ms per request
- **Model**: 100M parameter Pocket-TTS optimized for CPU

## 🔌 Server Startup

Startup output:
```
✅ FastAPI configured and ready to run
📂 Voice folder: D:\pocket-tts-api\voices
🎤 Available voices: alba, marius, javert, jean, fantine, cosette, eponine, azelma
🔊 Default voice: alba

================================================
🚀 Voice Generation API Server
📡 Server: http://localhost:8547
================================================
   GET  /
   GET  /health
   GET  /getvoiceslist
   POST /generate
================================================
```

## 🛑 Graceful Shutdown

Press `CTRL+C` to stop the server. It will:
- Clean up temporary files
- Close TTS model properly
- Exit gracefully

## 📝 License

MIT

## 🙏 Credits

- [Kyutai Labs](https://kyutai.org/) - Pocket-TTS model
- [pocket-tts](https://github.com/umairzahid604/pocket-tts) - Original implementation
