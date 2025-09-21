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
