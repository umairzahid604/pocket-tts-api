require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getSharedTTS, closeSharedTTS } = require('pocket-tts');

const app = express();
const PORT = process.env.PORT || 8547;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paths
const TEMP_DIR = path.join(__dirname, 'temp');
const VOICE_FOLDER = path.join(__dirname, 'voices');

// Create directories if they don't exist
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}
if (!fs.existsSync(VOICE_FOLDER)) {
    fs.mkdirSync(VOICE_FOLDER, { recursive: true });
}

// Global TTS instance
let model = null;

// Default voice
const DEFAULT_VOICE = 'alba';

// Built-in voices list
const BUILTIN_VOICES = ['alba', 'marius', 'javert', 'jean', 'fantine', 'cosette', 'eponine', 'azelma'];

/**
 * Get list of available voice names (without extension)
 * Python compatible function
 */
function get_available_voices() {
    const voices = [];
    
    // Add built-in voices first
    voices.push(...BUILTIN_VOICES);
    
    // Add custom voices from folder
    if (fs.existsSync(VOICE_FOLDER)) {
        const files = fs.readdirSync(VOICE_FOLDER);
        for (const file of files) {
            if (file.endsWith('.wav')) {
                const voice_name = path.basename(file, '.wav');
                // Only add if not already in list (avoid duplicates with built-in)
                if (!voices.includes(voice_name)) {
                    voices.push(voice_name);
                }
            }
        }
    }
    
    return voices;
}

/**
 * Get full path for a voice name
 * Python compatible function
 */
function get_voice_path(voice_name) {
    // Check if it's a built-in voice
    if (BUILTIN_VOICES.includes(voice_name)) {
        return voice_name; // Return as-is for built-in voices
    }
    
    // Check voices folder for WAV file
    const wav_path = path.join(VOICE_FOLDER, `${voice_name}.wav`);
    if (fs.existsSync(wav_path)) {
        return wav_path;
    }
    
    return null;
}

/**
 * Count words in text
 */
function count_words(text) {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Initialize TTS model on server startup
 */
async function initializeTTS() {
    try {
        console.log('🔄 Loading TTS model into memory...');
        model = await getSharedTTS();
        console.log('✅ TTS model loaded successfully! Server is ready.');
    } catch (error) {
        console.error('❌ Failed to load TTS model:', error.message);
        console.error('Error details:', error);
        process.exit(1);
    }
}

/**
 * Clean up old temporary files
 */
function cleanupTempFiles() {
    try {
        const files = fs.readdirSync(TEMP_DIR);
        const now = Date.now();
        const MAX_AGE = 5 * 60 * 1000; // 5 minutes

        files.forEach(file => {
            const filePath = path.join(TEMP_DIR, file);
            const stats = fs.statSync(filePath);
            if (now - stats.mtimeMs > MAX_AGE) {
                fs.unlinkSync(filePath);
            }
        });
    } catch (error) {
        console.error('Error cleaning temp files:', error.message);
    }
}

// Clean up temp files every 5 minutes
setInterval(cleanupTempFiles, 5 * 60 * 1000);

// ==================== PYTHON API COMPATIBLE ENDPOINTS ====================

/**
 * Root endpoint
 */
app.get('/', (req, res) => {
    res.json({
        message: 'Voice Generation API',
        status: 'running'
    });
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy'
    });
});

/**
 * Get voices list - Python API compatible
 */
app.get('/getvoiceslist', (req, res) => {
    const voices = get_available_voices();
    res.json({
        voices: voices,
        default: DEFAULT_VOICE,
        total: voices.length
    });
});

/**
 * Generate TTS - Python API compatible
 */
app.post('/generate', async (req, res) => {
    console.log(req.body)
    try {
        const { text, voice = DEFAULT_VOICE } = req.body;
        const text_trimmed = (text || '').trim();
        const voice_name = (voice || DEFAULT_VOICE).trim();
        // Validation
        if (!text_trimmed) {
            return res.status(400).json({
                detail: 'Text is required'
            });
        }

        // Get voice path
        const voice_path = get_voice_path(voice_name);
        if (!voice_path) {
            const available = get_available_voices();
            return res.status(400).json({
                detail: `Voice '${voice_name}' not found. Available voices: ${available.join(', ')}`
            });
        }

        const word_count = count_words(text_trimmed);
        const chunks_count = 1; // Simple implementation, no chunking

        console.log(`📝 API Request: ${word_count} words, ${chunks_count} chunks, voice: ${voice_name}`);

        // Create temp file path
        const timestamp = Date.now();
        const outputPath = path.join(TEMP_DIR, `generated_${timestamp}.wav`);

        // Generate TTS audio
        await model.generate({
            text: text_trimmed,
            voice: voice_path,
            outputPath: outputPath
        });

        console.log(`✅ TTS generated`);

        // Set headers (Python API compatible)
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Disposition', 'attachment; filename=generated.wav');
        res.setHeader('X-Word-Count', word_count.toString());
        res.setHeader('X-Chunks-Count', chunks_count.toString());
        res.setHeader('X-Voice-Used', voice_name);

        // Send file and cleanup
        res.sendFile(outputPath, (err) => {
            if (err) {
                console.error('Error sending file:', err);
            }
            // Delete file after sending
            setTimeout(() => {
                if (fs.existsSync(outputPath)) {
                    fs.unlinkSync(outputPath);
                }
            }, 1000);
        });

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        res.status(500).json({
            detail: error.message || 'Internal server error'
        });
    }
});

// ==================== SERVER STARTUP ====================

//Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    cleanupTempFiles();
    closeSharedTTS();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    cleanupTempFiles();
    closeSharedTTS();
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        // Initialize TTS model before starting server
        await initializeTTS();

        // Start Express server
        app.listen(PORT, () => {
            console.log('✅ FastAPI configured and ready to run');
            console.log(`📂 Voice folder: ${VOICE_FOLDER}`);
            console.log(`🎤 Available voices: ${get_available_voices().join(', ')}`);
            console.log(`🔊 Default voice: ${DEFAULT_VOICE}`);
            console.log('');
            console.log('================================================');
            console.log(`🚀 Voice Generation API Server`);
            console.log(`📡 Server: http://localhost:${PORT}`);
            console.log('================================================');
            console.log(`   GET  /`);
            console.log(`   GET  /health`);
            console.log(`   GET  /getvoiceslist`);
            console.log(`   POST /generate`);
            console.log('================================================');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();
