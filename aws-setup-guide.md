# AWS Setup Guide for Smart Waste Sorting Kiosk

## Current Issue
The app is using fallback because AWS credentials are not properly configured. Here's how to fix it:

## Option 1: Quick Fix - Use Local Storage (Recommended for Demo)
Replace AWS calls with localStorage to simulate database functionality without AWS setup.

## Option 2: Full AWS Setup (Production)

### Step 1: Create Cognito Identity Pool
1. Go to AWS Cognito Console
2. Create new Identity Pool
3. Enable "Unauthenticated identities"
4. Note the Identity Pool ID

### Step 2: Create DynamoDB Tables
```bash
# Create WasteTypes table
aws dynamodb create-table \
    --table-name WasteTypes \
    --attribute-definitions AttributeName=wasteType,AttributeType=S \
    --key-schema AttributeName=wasteType,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create KioskSessions table  
aws dynamodb create-table \
    --table-name KioskSessions \
    --attribute-definitions AttributeName=sessionId,AttributeType=S \
    --key-schema AttributeName=sessionId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

### Step 3: Populate Sample Data
```bash
# Add waste types
aws dynamodb put-item --table-name WasteTypes --item '{"wasteType":{"S":"Plastic Bottle"},"points":{"N":"15"}}'
aws dynamodb put-item --table-name WasteTypes --item '{"wasteType":{"S":"Aluminum Can"},"points":{"N":"20"}}'
aws dynamodb put-item --table-name WasteTypes --item '{"wasteType":{"S":"Glass Bottle"},"points":{"N":"25"}}'
```

### Step 4: Update Credentials
Replace placeholder in aws-config.js with your actual Identity Pool ID.

## Current Status
- ❌ AWS credentials are placeholders
- ❌ DynamoDB tables don't exist
- ✅ Fallback system works
- ✅ App functionality intact

## Recommendation
For immediate testing, implement localStorage fallback to simulate AWS functionality.