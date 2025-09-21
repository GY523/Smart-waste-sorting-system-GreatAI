import json
import boto3
import base64

def lambda_handler(event, context):
    # Initialize SageMaker Runtime client
    sagemaker = boto3.client('sagemaker-runtime')
    
    try:
        # Get image data from request
        body = json.loads(event['body'])
        image_data = body['image']
        
        # Remove data URL prefix if present
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Convert base64 to bytes
        image_bytes = base64.b64decode(image_data)
        
        # Call SageMaker endpoint
        response = sagemaker.invoke_endpoint(
            EndpointName='waste-endpoint-20250921-152952',
            ContentType='image/jpeg',
            Body=image_bytes
        )
        
        # Parse response
        result = json.loads(response['Body'].read().decode())
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            'body': json.dumps({'error': str(e)})
        }