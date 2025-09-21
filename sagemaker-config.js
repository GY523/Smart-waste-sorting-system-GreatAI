// SageMaker Configuration for Waste Classification
const SAGEMAKER_CONFIG = {
    endpointName: 'waste-endpoint-20250921-152952',
    region: 'us-east-1',
    
    // Set to true to use mock mode (no AWS credentials needed)
    mockMode: true, // Temporarily use mock mode to test app
    
    // Cognito Identity Pool ID
    identityPoolId: 'us-east-1:33290c7f-513f-4c2d-81ce-a0829d81dfee',
    
    // Expected response format from your model
    responseFormat: {
        // Adjust based on your model's actual output format
        predictionKey: 'predicted_class', // or 'prediction', 'class', etc.
        confidenceKey: 'confidence'       // or 'score', 'probability', etc.
    }
};

// Initialize AWS SDK with SageMaker configuration
function initializeSageMaker() {
    if (SAGEMAKER_CONFIG.mockMode) {
        console.log('🤖 Running in MOCK MODE - no AWS credentials needed');
        return;
    }
    
    // Use Cognito Identity Pool for authentication
    AWS.config.update({
        region: SAGEMAKER_CONFIG.region,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: SAGEMAKER_CONFIG.identityPoolId
        })
    });
    
    console.log('🤖 SageMaker configured for endpoint:', SAGEMAKER_CONFIG.endpointName);
    console.log('🔑 Using Identity Pool:', SAGEMAKER_CONFIG.identityPoolId);
}

// Test SageMaker endpoint connectivity
async function testSageMakerEndpoint() {
    if (SAGEMAKER_CONFIG.mockMode) {
        console.log('✅ Mock mode - SageMaker test skipped');
        return true;
    }
    
    try {
        // Check if SageMaker Runtime is available
        if (!AWS.SageMakerRuntime) {
            throw new Error('SageMaker Runtime not available in AWS SDK');
        }
        
        const sagemaker = new AWS.SageMakerRuntime();
        
        // Create a small test image (1x1 pixel JPEG)
        const testImageBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A';
        const testImageBytes = Uint8Array.from(atob(testImageBase64), c => c.charCodeAt(0));
        
        const params = {
            EndpointName: SAGEMAKER_CONFIG.endpointName,
            ContentType: 'image/jpeg',
            Body: testImageBytes
        };
        
        const result = await sagemaker.invokeEndpoint(params).promise();
        console.log('✅ SageMaker endpoint test successful');
        return true;
        
    } catch (error) {
        console.error('❌ SageMaker endpoint test failed:', error.message);
        
        // Provide specific guidance based on error type
        if (error.code === 'AccessDenied' || error.message.includes('not authorized')) {
            console.log('🔧 Fix: Add SageMaker permissions to Cognito role');
            console.log('1. Go to IAM Console -> Roles');
            console.log('2. Find: Cognito_waste_kiosk_poolUnauth_Role');
            console.log('3. Add policy: AmazonSageMakerReadOnly');
        }
        
        return false;
    }
}

// Export for use in main app
window.SAGEMAKER_CONFIG = SAGEMAKER_CONFIG;
window.initializeSageMaker = initializeSageMaker;
window.testSageMakerEndpoint = testSageMakerEndpoint;