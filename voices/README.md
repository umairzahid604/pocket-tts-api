# Custom Voices Folder

Is folder mein aap apni custom voice files (WAV format) rakh sakte hain.

## 📁 Kaise Use Karein:

1. **Voice file add karein**: Apni WAV file ko is folder mein copy karein
   - Example: `myvoice.wav`, `john.wav`, etc.

2. **API se use karein**: File ka name (without extension) as voice parameter use karein
   ```json
   {
     "text": "Hello world",
     "voice": "myvoice"
   }
   ```

## ✅ Requirements:

- File format: **WAV** only
- Naming: Koi bhi naam use kar sakte hain (no special characters recommended)
- Size: Voice cloning ke liye 5-30 seconds ki audio recommended

## 🎯 Example:

Agar aap `ahmed.wav` file is folder mein rakhte hain, to API mein aise use karein:

```bash
curl -X POST http://localhost:3000/api/tts/generate \
  -H "Content-Type: application/json" \
  -d '{"text": "Assalam o Alaikum", "voice": "ahmed"}' \
  --output output.wav
```

## 📝 Notes:

- Built-in voices (alba, marius, etc.) pehle se available hain
- Custom voices automatically detect ho jayein gi
- Server restart ki zaroorat nahi - new files automatically available ho jati hain
- `/api/tts/voices` endpoint se sari available voices ka list mil jata hai

## 🔍 Check Available Voices:

```bash
curl http://localhost:3000/api/tts/voices
```

Response:
```json
{
  "success": true,
  "voices": ["alba", "marius", "javert", "ahmed", "myvoice"],
  "count": 5,
  "builtin": ["alba", "marius", "javert", "jean", "fantine", "cosette", "eponine", "azelma"],
  "custom": ["ahmed", "myvoice"]
}
```
