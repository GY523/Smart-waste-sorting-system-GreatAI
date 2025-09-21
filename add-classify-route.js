// Add this route to your backend server (server.js or app.js)

const AWS = require('aws-sdk');

// Configure AWS SageMaker Runtime
const sagemakerRuntime = new AWS.SageMakerRuntime({
    region: 'us-east-1' // Change to your region
});

// Add this route to your Express app
app.post('/classify', async (req, res) => {
    try {
        const { endpoint, image } = req.body;
        
        // Remove data:image/jpeg;base64, prefix if present
        const base64Image = image.replace(/^data:image\/[a-z]+;base64,/, '');
        
        const params = {
            EndpointName: endpoint,
            ContentType: 'application/json',
            Body: JSON.stringify({ image: base64Image })
        };
        
        const result = await sagemakerRuntime.invokeEndpoint(params).promise();
        const prediction = JSON.parse(result.Body.toString());
        
        res.json(prediction);
        
    } catch (error) {
        console.error('SageMaker error:', error);
        res.status(500).json({ error: error.message });
    }
});