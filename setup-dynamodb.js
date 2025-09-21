// DynamoDB Setup Script for Smart Waste Sorting Kiosk
// Run this script to create tables and populate sample data

// Configure AWS SDK
AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:12345678-1234-1234-1234-123456789012'
    })
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

async function setupDynamoDB() {
    console.log('🚀 Setting up DynamoDB tables...');
    
    try {
        // Create WasteTypes table
        await createWasteTypesTable();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for table creation
        
        // Create KioskSessions table
        await createKioskSessionsTable();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for table creation
        
        // Populate sample data
        await populateWasteTypes();
        
        console.log('✅ DynamoDB setup complete!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

async function createWasteTypesTable() {
    const params = {
        TableName: 'WasteTypes',
        KeySchema: [
            { AttributeName: 'wasteType', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'wasteType', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };
    
    try {
        await dynamodb.createTable(params).promise();
        console.log('✅ WasteTypes table created');
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log('ℹ️ WasteTypes table already exists');
        } else {
            throw error;
        }
    }
}

async function createKioskSessionsTable() {
    const params = {
        TableName: 'KioskSessions',
        KeySchema: [
            { AttributeName: 'sessionId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'sessionId', AttributeType: 'S' }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };
    
    try {
        await dynamodb.createTable(params).promise();
        console.log('✅ KioskSessions table created');
    } catch (error) {
        if (error.code === 'ResourceInUseException') {
            console.log('ℹ️ KioskSessions table already exists');
        } else {
            throw error;
        }
    }
}

async function populateWasteTypes() {
    const wasteTypes = [
        { wasteType: 'Plastic Bottle', points: 15, category: 'recyclable' },
        { wasteType: 'Aluminum Can', points: 20, category: 'recyclable' },
        { wasteType: 'Glass Bottle', points: 25, category: 'recyclable' },
        { wasteType: 'Paper Cup', points: 10, category: 'recyclable' },
        { wasteType: 'Cardboard', points: 12, category: 'recyclable' },
        { wasteType: 'Unknown Item', points: 5, category: 'general' }
    ];
    
    for (const item of wasteTypes) {
        try {
            await docClient.put({
                TableName: 'WasteTypes',
                Item: item
            }).promise();
            console.log(`✅ Added ${item.wasteType}: ${item.points} points`);
        } catch (error) {
            console.error(`❌ Failed to add ${item.wasteType}:`, error);
        }
    }
}

// Run setup when script is loaded
setupDynamoDB();