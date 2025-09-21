// Add this route to your backend server file (server.js or app.js)

const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
    region: 'us-east-1', // Replace with your AWS region
    // Add your AWS credentials here or use environment variables
});

const sagemakerRuntime = new AWS.SageMakerRuntime();

// Add this route to your Express app
app.post('/classify', async (req, res) => {
    try {
        const { endpoint, image } = req.body;
        
        console.log('🤖 Received classification request for endpoint:', endpoint);
        
        // Convert base64 image to buffer
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');
        
        // Prepare SageMaker request
        const params = {
            EndpointName: endpoint,
            ContentType: 'image/jpeg',
            Body: imageBuffer
        };
        
        console.log('📡 Calling SageMaker endpoint...');
        
        // Call SageMaker endpoint
        const result = await sagemakerRuntime.invokeEndpoint(params).promise();
        
        // Parse the response
        const prediction = JSON.parse(result.Body.toString());
        
        console.log('✅ SageMaker response:', prediction);
        
        // Format response for frontend
        const response = {
            success: true,
            wasteType: prediction.predicted_class || prediction.class || 'Unknown',
            confidence: prediction.confidence || prediction.score || 0.5
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Classification error:', error);
        
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});