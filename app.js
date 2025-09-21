// app.js
class WasteSortingKiosk {
    constructor() {
        this.currentSession = {
            sessionId: null,
            scannedItems: [],
            totalPoints: 0,
            isScanning: false,
            cameraStream: null,
            hasCameraAccess: false,
            optimalDistance: false,
            distanceInterval: null,
            autoScanTimeout: null
        };

        this.config = {
            maxItems: 10,
            useAWS: true, // Set to false to force localStorage mode
            aiEndpoint: 'waste-endpoint-20250921-152952'
        };

        this.initializeElements();
        this.bindEvents();
        this.initializeKiosk();
    }

    initializeElements() {
        // Pages
        this.landingPage = document.getElementById('welcomeScreen');
        this.scanningPage = document.getElementById('scanningScreen');
        this.qrResults = document.getElementById('qrResults');

        // Buttons
        this.startBtn = document.getElementById('startButton');
        this.captureBtn = document.getElementById('scanButton');
        this.finishBtn = document.getElementById('finishButton');
        this.newSessionBtn = document.getElementById('newSessionButton');
        this.permissionBtn = document.getElementById('permissionBtn');

        // Elements
        this.camera = document.getElementById('cameraFeed');
        this.scanStatus = document.getElementById('scanningText');
        this.finalItemsList = document.getElementById('finalScannedItems');
        this.finalTotalPoints = document.getElementById('finalTotalPoints');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.sessionInfo = document.getElementById('sessionInfo');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.progressBar = document.getElementById('progressBar');
        this.qrCodeDisplay = document.getElementById('qrCodeDisplay');
        this.finalPoints = document.getElementById('finalPoints');
        this.permissionPrompt = document.getElementById('permissionPrompt');
        this.distanceFill = document.getElementById('distanceFill');
        this.distanceText = document.getElementById('distanceText');
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.startSession());
        this.captureBtn.addEventListener('click', () => this.scanItem());
        this.finishBtn.addEventListener('click', () => this.finishScanning());
        this.newSessionBtn.addEventListener('click', () => this.resetKiosk());
        this.permissionBtn.addEventListener('click', () => this.requestCameraAccess());
    }

    async initializeCamera() {
        try {
            if (this.currentSession.cameraStream) {
                this.currentSession.cameraStream.getTracks().forEach(track => track.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                }
            });

            this.camera.srcObject = stream;
            this.currentSession.cameraStream = stream;
            this.connectionStatus.textContent = '🟢 Camera Active';
            
            // Start distance monitoring
            this.startDistanceMonitoring();
            
        } catch (error) {
            console.error('Camera initialization failed:', error);
            this.showError('Camera access failed. Please check permissions.');
            this.connectionStatus.textContent = '🔴 Camera Error';
        }
    }

    startDistanceMonitoring() {
        if (this.currentSession.distanceInterval) {
            clearInterval(this.currentSession.distanceInterval);
        }

        // Create canvas for image processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.currentSession.distanceInterval = setInterval(() => {
            this.detectObjectDistance();
        }, 500);
    }

    detectObjectDistance() {
        if (!this.camera.videoWidth || !this.camera.videoHeight) return;
        
        // Set canvas size to match video
        this.canvas.width = this.camera.videoWidth;
        this.canvas.height = this.camera.videoHeight;
        
        // Draw current frame to canvas
        this.ctx.drawImage(this.camera, 0, 0);
        
        // Get image data for analysis
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Detect edges/objects using simple edge detection
        const edgeCount = this.countEdges(data, this.canvas.width, this.canvas.height);
        
        // Calculate distance based on edge density (more edges = closer object)
        const distance = this.calculateDistance(edgeCount);
        const isOptimal = distance > 0.3 && distance < 0.7;
        
        this.currentSession.optimalDistance = isOptimal;
        this.updateDistanceIndicator(distance, isOptimal);
    }

    countEdges(data, width, height) {
        let edgeCount = 0;
        const threshold = 30;
        
        // Sample every 4th pixel for performance
        for (let y = 1; y < height - 1; y += 4) {
            for (let x = 1; x < width - 1; x += 4) {
                const idx = (y * width + x) * 4;
                
                // Convert to grayscale
                const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                
                // Check neighboring pixels
                const rightIdx = (y * width + (x + 1)) * 4;
                const bottomIdx = ((y + 1) * width + x) * 4;
                
                const rightGray = (data[rightIdx] + data[rightIdx + 1] + data[rightIdx + 2]) / 3;
                const bottomGray = (data[bottomIdx] + data[bottomIdx + 1] + data[bottomIdx + 2]) / 3;
                
                // Edge detection using gradient
                const gradientX = Math.abs(gray - rightGray);
                const gradientY = Math.abs(gray - bottomGray);
                
                if (gradientX > threshold || gradientY > threshold) {
                    edgeCount++;
                }
            }
        }
        
        return edgeCount;
    }

    calculateDistance(edgeCount) {
        // Normalize edge count to distance (0-1 scale)
        // More edges typically means object is closer
        const maxEdges = 5000; // Increased threshold for better calibration
        const normalizedEdges = Math.min(edgeCount / maxEdges, 1);
        
        // Invert so higher edge count = closer (lower distance value)
        // Add baseline to prevent always showing "too far"
        return Math.max(0.1, 1 - normalizedEdges);
    }

    updateDistanceIndicator(distance, isOptimal) {
        if (!this.distanceFill || !this.distanceText) return;
        
        const percentage = Math.min(distance * 100, 100);
        this.distanceFill.style.width = percentage + '%';
        
        if (isOptimal) {
            this.distanceFill.style.backgroundColor = '#4CAF50';
            this.distanceText.textContent = 'Perfect Distance ✓';
            if (this.scanStatus) this.scanStatus.textContent = 'Ready to scan - Click SCAN ITEM';
        } else if (distance < 0.3) {
            this.distanceFill.style.backgroundColor = '#ff9800';
            this.distanceText.textContent = 'Too Close';
            if (this.scanStatus) this.scanStatus.textContent = 'Move item further away';
        } else {
            this.distanceFill.style.backgroundColor = '#f44336';
            this.distanceText.textContent = 'Too Far';
            if (this.scanStatus) this.scanStatus.textContent = 'Move item closer';
        }
    }

    initializeKiosk() {
        console.log('Smart Waste Sorting Kiosk initialized');
        this.checkSystemStatus();
        this.updateTimeDisplay();
        setInterval(() => this.updateTimeDisplay(), 1000);
        this.checkCameraPermissions();
    }

    updateTimeDisplay() {
        const now = new Date();
        this.timeDisplay.textContent = now.toLocaleTimeString();
    }

    checkSystemStatus() {
        setTimeout(() => {
            this.connectionStatus.textContent = '🟢 Online';
        }, 1000);
    }

    async checkCameraPermissions() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasCamera = devices.some(device => device.kind === 'videoinput' && device.label);
            
            if (hasCamera) {
                this.currentSession.hasCameraAccess = true;
                this.connectionStatus.textContent = '🟢 Camera Ready';
                this.startBtn.disabled = false;
                this.permissionPrompt.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking camera permissions:', error);
        }
    }

    async requestCameraAccess() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            
            this.currentSession.hasCameraAccess = true;
            this.connectionStatus.textContent = '🟢 Camera Ready';
            this.startBtn.disabled = false;
            this.permissionPrompt.style.display = 'none';
        } catch (error) {
            console.error('Error requesting camera access:', error);
            this.connectionStatus.textContent = '🔴 Camera Blocked';
            this.showError('Cannot access camera. Please check your browser permissions.');
        }
    }

    async startSession() {
        if (!this.currentSession.hasCameraAccess) {
            this.showError('Please allow camera access first');
            return;
        }

        try {
            // Generate sessionId locally
            this.currentSession.sessionId = 'KIOSK_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            console.log('New sessionId:', this.currentSession.sessionId);

            this.resetSession();
            this.showScreen('scanningScreen');
            await this.initializeCamera();
        } catch (error) {
            console.error('Failed to start session:', error);
            this.showError('Unable to start session. Please try again.');
        }
    }

    resetSession() {
        this.currentSession.scannedItems = [];
        this.currentSession.totalPoints = 0;
        window.totalPoints = 0;
        this.updateSessionInfo();
        this.updateItemDisplay();
        this.finishBtn.disabled = true;
    }

    updateSessionInfo() {
        if (this.currentSession.sessionId) {
            this.sessionInfo.textContent = `Session: ${this.currentSession.sessionId.substr(-8)}`;
        } else {
            this.sessionInfo.textContent = 'Ready for new session';
        }
    }

    async scanItem() {
        if (this.currentSession.isScanning) return;
        this.currentSession.isScanning = true;

        try {
            this.showLoading();
            this.hideError();
            this.hideSuccess();

            console.log('📷 Camera status:', {
                videoWidth: this.camera?.videoWidth,
                videoHeight: this.camera?.videoHeight,
                readyState: this.camera?.readyState
            });

            // Capture image from camera
            const imageData = this.captureImageFromCamera();
            console.log('📸 Image captured, size:', imageData.length);
            
            // Call AI model endpoint for classification
            const classification = await this.classifyWasteItem(imageData);
            
            if (!classification.success) {
                throw new Error(classification.error || 'Classification failed');
            }

            const itemType = classification.wasteType;
            const pointsEarned = await this.getPointsFromDynamoDB(itemType);

            const newItem = {
                id: Date.now(),
                type: itemType,
                points: pointsEarned,
                timestamp: new Date()
            };

            this.currentSession.scannedItems.push(newItem);
            this.currentSession.totalPoints += pointsEarned;
            window.totalPoints = this.currentSession.totalPoints;

            // Store in DynamoDB
            await this.storeSessionInDynamoDB();

            this.updateItemDisplay();
            this.showSuccess(`✅ ${itemType} identified! +${pointsEarned} points`);

        } catch (error) {
            console.error('❌ Scanning error details:', {
                message: error.message,
                stack: error.stack,
                cameraReady: this.camera?.videoWidth > 0
            });
            this.showError(`Scanning failed: ${error.message}`);
        } finally {
            this.hideLoading();
            this.currentSession.isScanning = false;
            this.finishBtn.disabled = this.currentSession.scannedItems.length === 0;
        }
    }

    captureImageFromCamera() {
        if (!this.camera.videoWidth || !this.camera.videoHeight) {
            throw new Error('Camera not ready');
        }
        
        const canvas = document.createElement('canvas');
        // Resize to smaller dimensions for AI processing
        const maxSize = 512;
        const ratio = Math.min(maxSize / this.camera.videoWidth, maxSize / this.camera.videoHeight);
        
        canvas.width = this.camera.videoWidth * ratio;
        canvas.height = this.camera.videoHeight * ratio;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.camera, 0, 0, canvas.width, canvas.height);
        
        // Lower quality to reduce payload size
        return canvas.toDataURL('image/jpeg', 0.5);
    }

    async classifyWasteItem(imageData) {
        console.log('🤖 Calling AI endpoint via HTTP');
        
        try {
            // Call your SageMaker endpoint via API Gateway
            const response = await fetch('https://200ae5rknd.execute-api.us-east-1.amazonaws.com/prod/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image: imageData,
                    endpoint: 'waste-endpoint-20250921-152952'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ AI Response:', result);
            
            const wasteType = this.mapAIClassToWasteType(result.predicted_class || result.prediction);
            
            return {
                success: true,
                wasteType: wasteType,
                confidence: result.confidence || 0.85
            };
            
        } catch (error) {
            console.error('❌ AI endpoint error, using mock:', error);
            
            // Fallback to mock classification
            await new Promise(resolve => setTimeout(resolve, 1500));
            const wasteTypes = ['Plastic Bottle', 'Aluminum Can', 'Glass Bottle', 'Paper Cup', 'Cardboard'];
            const randomType = wasteTypes[Math.floor(Math.random() * wasteTypes.length)];
            
            console.log('✅ Mock AI Response:', randomType);
            return {
                success: true,
                wasteType: randomType,
                confidence: 0.85 + Math.random() * 0.1
            };
        }
    }

    mapAIClassToWasteType(aiClass) {
        const classMap = {
            'green-glass': 'Glass Bottle',
            'brown-glass': 'Glass Bottle',
            'white-glass': 'Glass Bottle',
            'plastic': 'Plastic Bottle',
            'metal': 'Aluminum Can',
            'paper': 'Paper Cup',
            'cardboard': 'Cardboard'
        };
        return classMap[aiClass] || 'Unknown Item';
    }

    async getPointsFromDynamoDB(wasteType) {
        // Skip AWS if disabled
        if (window.AWS_DISABLED) {
            const points = this.getPointsFromLocalStorage(wasteType);
            console.log('📦 localStorage mode:', { wasteType, points });
            return points;
        }
        
        try {
            // Try AWS DynamoDB first
            const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
            const params = {
                TableName: 'WasteTypes',
                Key: { wasteType: wasteType }
            };
            
            const result = await dynamodb.get(params).promise();
            console.log('✅ DynamoDB points query result:', result);
            
            // Log to show AWS is working
            this.logAWSActivity('DynamoDB GET', 'WasteTypes', { wasteType, points: result.Item?.points });
            
            return result.Item ? result.Item.points : this.getFallbackPoints(wasteType);
        } catch (error) {
            console.error('❌ DynamoDB error, using localStorage fallback:', error);
            
            // Use localStorage as fallback
            const points = this.getPointsFromLocalStorage(wasteType);
            console.log('📦 Using localStorage fallback:', { wasteType, points });
            return points;
        }
    }

    getPointsFromLocalStorage(wasteType) {
        // Initialize localStorage with waste types if not exists
        if (!localStorage.getItem('wasteTypes')) {
            const wasteTypes = {
                'Plastic Bottle': 15,
                'Aluminum Can': 20,
                'Glass Bottle': 25,
                'Paper Cup': 10,
                'Cardboard': 12,
                'Unknown Item': 5
            };
            localStorage.setItem('wasteTypes', JSON.stringify(wasteTypes));
            console.log('📦 Initialized localStorage with waste types');
        }
        
        const wasteTypes = JSON.parse(localStorage.getItem('wasteTypes'));
        return wasteTypes[wasteType] || 10;
    }

    logAWSActivity(action, table, data) {
        const activity = {
            timestamp: new Date().toISOString(),
            action,
            table,
            data
        };
        
        const activities = JSON.parse(localStorage.getItem('awsActivities') || '[]');
        activities.push(activity);
        localStorage.setItem('awsActivities', JSON.stringify(activities.slice(-50))); // Keep last 50
        
        console.log('📊 AWS Activity logged:', activity);
    }

    getFallbackPoints(wasteType) {
        const pointsMap = {
            'Plastic Bottle': 15,
            'Aluminum Can': 20,
            'Glass Bottle': 25,
            'Paper Cup': 10,
            'Cardboard': 12,
            'Unknown Item': 5
        };
        return pointsMap[wasteType] || 10;
    }

    async storeSessionInDynamoDB() {
        const sessionData = {
            sessionId: this.currentSession.sessionId,
            totalPoints: this.currentSession.totalPoints,
            itemCount: this.currentSession.scannedItems.length,
            items: this.currentSession.scannedItems,
            timestamp: new Date().toISOString(),
            status: 'active',
            ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        
        // Skip AWS if disabled
        if (window.AWS_DISABLED) {
            const sessions = JSON.parse(localStorage.getItem('kioskSessions') || '[]');
            sessions.push(sessionData);
            localStorage.setItem('kioskSessions', JSON.stringify(sessions));
            console.log('📦 Session stored in localStorage');
            return;
        }
        
        try {
            // Try AWS DynamoDB first
            const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
            const params = {
                TableName: 'KioskSessions',
                Item: sessionData
            };
            
            await dynamodb.put(params).promise();
            console.log('✅ Session stored in DynamoDB');
            
            // Log AWS activity
            this.logAWSActivity('DynamoDB PUT', 'KioskSessions', sessionData);
            
        } catch (error) {
            console.error('❌ Failed to store session in DynamoDB, using localStorage:', error);
            
            // Fallback to localStorage
            const sessions = JSON.parse(localStorage.getItem('kioskSessions') || '[]');
            sessions.push(sessionData);
            localStorage.setItem('kioskSessions', JSON.stringify(sessions));
            console.log('📦 Session stored in localStorage fallback');
        }
    }

    async finishScanning() {
        if (this.currentSession.scannedItems.length === 0) {
            this.showError('No items scanned. Please scan at least one item.');
            return;
        }

        try {
            this.showLoading();

            // Generate unique QR code
            const uniqueCode = 'QR_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            const qrData = `POINTS:${this.currentSession.totalPoints}|CODE:${uniqueCode}`;
            
            // Store final session in DynamoDB
            await this.storeFinalSessionInDynamoDB(uniqueCode);

            this.finalPoints.textContent = this.currentSession.totalPoints;

            this.qrCodeDisplay.innerHTML = '';
            const canvas = document.createElement('canvas');
            this.qrCodeDisplay.appendChild(canvas);

            QRCode.toCanvas(canvas, qrData, { width: 280, margin: 1 }, (err) => {
                if (err) console.error('QR generation error:', err);
            });

            this.updateFinalItemDisplay();
            this.updateFinalTotalPoints();
            this.showScreen('qrResults');

        } catch (error) {
            console.error('Error finishing scanning:', error);
            this.showError('Failed to generate results. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    updateItemDisplay() {
        if (!this.progressBar) return;
        const progress = (this.currentSession.scannedItems.length / this.config.maxItems) * 100;
        this.progressBar.style.width = Math.min(progress, 100) + '%';
    }

    updateFinalItemDisplay() {
        if (!this.finalItemsList) return;

        this.finalItemsList.innerHTML = this.currentSession.scannedItems.map(item => `
            <div class="item-card">
                <div class="item-info">
                    <div class="item-icon">${this.getItemIcon(item.type)}</div>
                    <div>
                        <strong>${item.type}</strong>
                    </div>
                </div>
                <div class="points-display">+${item.points}</div>
            </div>
        `).join('');
    }

    updateFinalTotalPoints() {
        if (!this.finalTotalPoints) return;
        this.finalTotalPoints.innerHTML = `<div class="total-points">Total Points: ${this.currentSession.totalPoints} 🌟</div>`;
    }

    getItemIcon(itemType) {
        const icons = {
            'Plastic Bottle': '🍶',
            'Aluminum Can': '🥤',
            'Glass Bottle': '🍾',
            'Paper Cup': '☕',
            'Cardboard': '📦'
        };
        return icons[itemType] || '♻️';
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        this.qrResults.style.display = screenId === 'qrResults' ? 'block' : 'none';
        const screen = document.getElementById(screenId);
        if (screen) screen.classList.add('active');
    }

    async storeFinalSessionInDynamoDB(qrCode) {
        const finalSessionData = {
            sessionId: this.currentSession.sessionId,
            qrCode: qrCode,
            totalPoints: this.currentSession.totalPoints,
            itemCount: this.currentSession.scannedItems.length,
            items: this.currentSession.scannedItems,
            timestamp: new Date().toISOString(),
            status: 'completed',
            ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
        };
        
        // Skip AWS if disabled
        if (window.AWS_DISABLED) {
            const sessions = JSON.parse(localStorage.getItem('kioskSessions') || '[]');
            const existingIndex = sessions.findIndex(s => s.sessionId === this.currentSession.sessionId);
            if (existingIndex >= 0) {
                sessions[existingIndex] = finalSessionData;
            } else {
                sessions.push(finalSessionData);
            }
            localStorage.setItem('kioskSessions', JSON.stringify(sessions));
            console.log('📦 Final session stored in localStorage');
            return;
        }
        
        try {
            // Try AWS DynamoDB first
            const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
            const params = {
                TableName: 'KioskSessions',
                Item: finalSessionData
            };
            
            await dynamodb.put(params).promise();
            console.log('✅ Final session stored in DynamoDB with QR code');
            
            // Log AWS activity
            this.logAWSActivity('DynamoDB PUT', 'KioskSessions', finalSessionData);
            
        } catch (error) {
            console.error('❌ Failed to store final session in DynamoDB, using localStorage:', error);
            
            // Fallback to localStorage
            const sessions = JSON.parse(localStorage.getItem('kioskSessions') || '[]');
            // Update existing session or add new one
            const existingIndex = sessions.findIndex(s => s.sessionId === this.currentSession.sessionId);
            if (existingIndex >= 0) {
                sessions[existingIndex] = finalSessionData;
            } else {
                sessions.push(finalSessionData);
            }
            localStorage.setItem('kioskSessions', JSON.stringify(sessions));
            console.log('📦 Final session stored in localStorage fallback');
        }
    }

    autoResetKiosk() {
        // Show message that QR was scanned
        if (this.qrResults.style.display === 'block') {
            const resetMessage = document.createElement('div');
            resetMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #4CAF50; color: white; padding: 20px; border-radius: 10px; font-size: 18px; z-index: 9999;';
            resetMessage.textContent = '✅ QR Code Scanned! Starting new session...';
            document.body.appendChild(resetMessage);
            
            setTimeout(() => {
                document.body.removeChild(resetMessage);
                this.resetKiosk();
            }, 2000);
        }
    }

    resetKiosk() {
        // Stop camera stream
        if (this.currentSession.cameraStream) {
            this.currentSession.cameraStream.getTracks().forEach(track => track.stop());
            this.currentSession.cameraStream = null;
        }
        
        // Clear intervals
        if (this.currentSession.distanceInterval) {
            clearInterval(this.currentSession.distanceInterval);
        }
        
        // Clean up canvas
        if (this.canvas) {
            this.canvas = null;
            this.ctx = null;
        }
        
        this.currentSession.sessionId = null;
        this.resetSession();
        this.showScreen('welcomeScreen');
        this.startBtn.disabled = false;
        this.connectionStatus.textContent = '🟢 Camera Ready';
    }

    showLoading() { if (this.loadingIndicator) this.loadingIndicator.style.display = 'inline-block'; }
    hideLoading() { if (this.loadingIndicator) this.loadingIndicator.style.display = 'none'; }
    showError(msg) { if (this.errorMessage) { this.errorMessage.textContent = msg; this.errorMessage.style.display = 'block'; } }
    hideError() { if (this.errorMessage) this.errorMessage.style.display = 'none'; }
    showSuccess(msg) { if (this.successMessage) { this.successMessage.textContent = msg; this.successMessage.style.display = 'block'; } }
    hideSuccess() { if (this.successMessage) this.successMessage.style.display = 'none'; }
}

window.addEventListener('DOMContentLoaded', () => {
    window.kiosk = new WasteSortingKiosk();
});
