# Smart Waste Sorting Kiosk

Interactive kiosk application for scanning waste items and earning points using AWS Rekognition and DynamoDB.

## Features

- **Interactive UI**: Touch-friendly kiosk interface
- **Camera Integration**: Real-time waste item scanning
- **AWS Rekognition**: AI-powered waste type identification
- **DynamoDB Integration**: Points storage and user management
- **QR Code Generation**: For mobile app integration
- **Error Handling**: Comprehensive error management

## File Structure

```
kiosk-app/
├── index.html          # Main HTML structure
├── styles.css          # UI styling
├── app.js             # Main application logic
├── aws-config.js      # AWS service configurations
└── README.md          # This file
```

## What's Ready for Your Teammates

**Current Features Working:**
- ✅ Complete UI flow (welcome → scanning → results)
- ✅ Camera capture and display
- ✅ Item tracking and point accumulation
- ✅ QR code generation
- ✅ Error handling and loading states
- ✅ DynamoDB integration (active)
- ✅ Mock services for testing (fallback)

**For QR Code/Backend Developer:**
- The QR code is automatically generated when user clicks "FINISH" after scanning items
- Current QR data structure includes: sessionId, totalPoints, itemCount, items array, timestamp, expiresAt
- Session data is automatically stored in DynamoDB via `DynamoDBService.storeKioskSession()`
- If you need custom QR generation, modify `generateQRCode()` function around line 420 in `app.js`

**For AWS Rekognition teammate:**
- Replace the mock `identifyWasteItem()` function around line 200 in `app.js`
- The function receives an `imageData` and should return success/failure with waste type

**For DynamoDB teammate:**
- ✅ DynamoDB integration is ACTIVE - tables created and service connected
- ✅ Real DynamoDB calls are being made for points and session storage
- ✅ Fallback to mock data if DynamoDB calls fail
- Tables in use: WasteTypes, KioskSessions
- AWS SDK configured in `aws-config.js`

## Integration Points for Teammates

### For QR Code/Backend Developer

**QR Code Generation is AUTOMATIC** - no changes needed unless you want custom formatting:

```javascript
// Current QR data structure (automatically generated):
const qrData = {
    sessionId: this.currentSession.sessionId,
    totalPoints: this.currentSession.totalPoints,
    itemCount: this.currentSession.scannedItems.length,
    items: this.currentSession.scannedItems,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

// Session data is automatically stored in DynamoDB
// Only modify generateQRCode() if you need different QR format
```

### For AI/Rekognition Developer

Replace the mock function in `app.js`:

```javascript
async identifyWasteItem(imageData) {
    // Your Rekognition implementation here
    const rekognition = new AWS.Rekognition();
    const params = {
        Image: { Bytes: imageData },
        MaxLabels: 10,
        MinConfidence: 70
    };
    
    const result = await rekognition.detectLabels(params).promise();
    return { success: true, wasteType: 'Plastic Bottle', confidence: 0.95 };
}
```

### For DynamoDB Developer

**✅ INTEGRATION COMPLETE** - DynamoDB is already connected and working:

- Tables created: WasteTypes, KioskSessions
- AWS SDK configured in `aws-config.js`
- Real DynamoDB calls active in `app.js`
- Automatic fallback to mock data if calls fail

Current functions in use:
```javascript
// Already implemented and working:
DynamoDBService.getPointsForWasteType(wasteType)
DynamoDBService.storeKioskSession(sessionData)

// No changes needed unless you want to modify table structure
```

## Application Flow

1. **Welcome Screen**: User allows camera access and clicks "START SORTING"
2. **Camera Initialization**: Requests camera permissions and lists available cameras
3. **Scanning Loop**:
   - User positions item in frame at optimal distance
   - Clicks "SCAN ITEM"
   - AWS Rekognition identifies waste type
   - DynamoDB query retrieves points
   - Item added to scanned list
4. **Finish Scanning**: User clicks "FINISH"
5. **Results Screen**: 
   - Shows total points and items
   - Generates QR code with session data
   - Stores session in DynamoDB
6. **Mobile Integration**: User scans QR code with phone app
7. **Reset**: Returns to welcome screen for next user

## Setup Instructions

### Basic Setup

1. Open the project in Visual Studio Code
2. Install Live Server extension for testing
3. Right-click `index.html` and select "Open with Live Server"

### AWS Integration Setup

#### Prerequisites
- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js installed (for AWS SDK)

#### Install Dependencies
```bash
npm init -y
npm install aws-sdk qrcode
```

The application is ready to run in Visual Studio Code with Live Server extension, and your teammates can integrate their AWS services by replacing the clearly marked functions in the code.
