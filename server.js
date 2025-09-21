const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage for QR codes and sessions
let qrCodes = {}; // Store QR codes with their data
let activeSessions = {}; // Store active kiosk sessions
let kioskResetFlag = false; // Flag to trigger kiosk reset

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Generate new session with security validation
app.post('/session/generate', (req, res) => {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
    const qrCode = Math.random().toString(36).substring(2, 15).toUpperCase();
    
    activeSessions[sessionId] = { 
        points: 0, 
        items: [], 
        created: new Date(),
        lastActivity: new Date(),
        qrCode: qrCode,
        claimed: false // Track if QR has been claimed
    };
    console.log(`✅ New session created: ${sessionId}`);
    res.json({ sessionId, qrCode });
});

// Validate session with security checks
app.post('/session/validate', (req, res) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ valid: false, error: 'No sessionId provided' });
    }

    const session = activeSessions[sessionId];
    if (!session) {
        return res.json({ valid: false, error: 'Session not found' });
    }

    // Check if session is expired (24 hours)
    const now = new Date();
    const sessionAge = now - session.created;
    if (sessionAge > 24 * 60 * 60 * 1000) {
        delete activeSessions[sessionId];
        return res.json({ valid: false, error: 'Session expired' });
    }

    // Update last activity
    session.lastActivity = now;
    res.json({ valid: true, session: { points: session.points, itemCount: session.items.length } });
});

// Add item with session validation
app.post('/session/add', (req, res) => {
    const { sessionId, item, points } = req.body;
    
    if (!sessionId || !item || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid request data' });
    }

    const session = activeSessions[sessionId];
    if (!session) {
        return res.status(404).json({ error: 'Invalid or expired session' });
    }

    // Security: Limit points per item
    const validatedPoints = Math.min(Math.max(points, 1), 50);
    
    session.items.push({ 
        item, 
        points: validatedPoints, 
        timestamp: new Date() 
    });
    session.points += validatedPoints;
    session.lastActivity = new Date();

    console.log(`📦 Session ${sessionId}: +${validatedPoints} points for ${item}`);
    res.json({ success: true, totalPoints: session.points });
});

// Get session info with validation
app.get('/session/:sessionId', (req, res) => {
    const session = activeSessions[req.params.sessionId];
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    res.json({
        points: session.points,
        itemCount: session.items.length,
        items: session.items,
        created: session.created
    });
});

// Store QR code from kiosk
app.post('/qr/store', (req, res) => {
    const { code, points, items } = req.body;
    
    if (!code || typeof points !== 'number') {
        return res.status(400).json({ error: 'Invalid QR data' });
    }

    qrCodes[code] = {
        points,
        items,
        created: new Date(),
        used: false
    };

    console.log(`📱 QR Code stored: ${code} (${points} points)`);
    res.json({ success: true });
});

// Claim QR code (one-time use)
app.post('/qr/claim', (req, res) => {
    const { code, deviceId } = req.body;
    
    if (!code) {
        return res.status(400).json({ success: false, error: 'No QR code provided' });
    }

    const qrData = qrCodes[code];
    if (!qrData) {
        return res.json({ success: false, error: 'Invalid QR code' });
    }

    // Get points before deleting
    const points = qrData.points;
    
    // Delete QR code immediately (one-time use)
    delete qrCodes[code];

    console.log(`✅ QR Code claimed and deleted: ${code} by ${deviceId}`);
    
    // Trigger kiosk reset flag
    kioskResetFlag = true;
    setTimeout(() => {
        kioskResetFlag = false;
    }, 10000); // Reset flag after 10 seconds
    
    res.json({ success: true, points });
});

// Cleanup unclaimed QR codes after 1 hour (in case user doesn't scan)
setInterval(() => {
    const now = new Date();
    Object.keys(qrCodes).forEach(code => {
        const qr = qrCodes[code];
        if (now - qr.created > 60 * 60 * 1000) { // 1 hour
            delete qrCodes[code];
            console.log(`🗑️ Cleaned up unclaimed QR: ${code}`);
        }
    });
}, 10 * 60 * 1000); // Check every 10 minutes

// AI Classification endpoint
app.post('/classify', async (req, res) => {
    try {
        const { endpoint, image } = req.body;
        
        // For now, simulate AI response (replace with actual AWS SageMaker call)
        const mockResponses = [
            { predicted_class: 'plastic', confidence: 0.85 },
            { predicted_class: 'green-glass', confidence: 0.78 },
            { predicted_class: 'metal', confidence: 0.92 },
            { predicted_class: 'paper', confidence: 0.67 },
            { predicted_class: 'cardboard', confidence: 0.73 }
        ];
        
        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        console.log(`🤖 AI Classification: ${randomResponse.predicted_class} (${(randomResponse.confidence * 100).toFixed(1)}%)`);
        
        res.json(randomResponse);
        
    } catch (error) {
        console.error('Classification error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint for kiosk to check if it should reset
app.get('/kiosk/should-reset', (req, res) => {
    const shouldReset = kioskResetFlag;
    if (shouldReset) {
        kioskResetFlag = false; // Reset flag after kiosk checks
    }
    res.json({ shouldReset });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Smart Waste Kiosk Server running on http://localhost:${PORT}`);
    console.log(`🏠 Local access: http://localhost:${PORT}`);
    console.log(`📱 Network access: http://192.168.0.132:${PORT}`);
});
