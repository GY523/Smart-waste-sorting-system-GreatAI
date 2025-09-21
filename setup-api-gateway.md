# Setup SageMaker API Gateway

## 1. Create Lambda Function
```bash
# Create Lambda function
aws lambda create-function \
  --function-name sagemaker-waste-classifier \
  --runtime python3.9 \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-sagemaker-role \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://lambda-sagemaker.zip
```

## 2. Create API Gateway
```bash
# Create REST API
aws apigateway create-rest-api --name sagemaker-waste-api

# Create resource and method (use API Gateway console for easier setup)
```

## 3. Quick Console Setup (Easier)

### Lambda Function:
1. **AWS Console** → **Lambda** → **Create function**
2. **Function name**: `sagemaker-waste-classifier`
3. **Runtime**: Python 3.9
4. **Copy code from lambda-sagemaker.py**
5. **Add IAM role with SageMaker permissions**

### API Gateway:
1. **AWS Console** → **API Gateway** → **Create API**
2. **REST API** → **Build**
3. **Create Resource**: `/predict`
4. **Create Method**: `POST`
5. **Integration**: Lambda Function
6. **Enable CORS**
7. **Deploy API** → Get URL

## 4. Update Your App
Replace the URL in app.js:
```javascript
const response = await fetch('https://YOUR-API-ID.execute-api.us-east-1.amazonaws.com/prod/predict', {
```

## 5. Test
Your kiosk app will now call real SageMaker endpoint!