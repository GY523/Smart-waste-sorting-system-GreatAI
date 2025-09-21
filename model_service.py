import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import io
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# TrashNet classes (matching your trained model)
CLASSES = ['plastic', 'paper', 'metal', 'glass', 'organic', 'cardboard']
RECYCLABLE = ['plastic', 'paper', 'metal', 'glass', 'cardboard']
POINTS_MAP = {
    'plastic': 10,
    'paper': 5,
    'metal': 15,
    'glass': 20,
    'cardboard': 8,
    'organic': 0  # Non-recyclable (was 'trash' in original dataset)
}

class TrashClassifier:
    def __init__(self, model_path):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = self.load_model(model_path)
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
    
    def load_model(self, model_path):
        model = models.resnet18(pretrained=False)
        model.fc = nn.Linear(model.fc.in_features, len(CLASSES))
        model.load_state_dict(torch.load(model_path, map_location=self.device))
        model.to(self.device)
        model.eval()
        return model
    
    def predict(self, image_data):
        try:
            # Decode base64 image
            image_data = image_data.split(',')[1]  # Remove data:image/jpeg;base64,
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
            
            # Transform and predict
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = torch.nn.functional.softmax(outputs[0], dim=0)
                confidence, predicted = torch.max(probabilities, 0)
                
            predicted_class = CLASSES[predicted.item()]
            confidence_score = confidence.item()
            
            # Check if recyclable
            is_recyclable = predicted_class in RECYCLABLE
            points = POINTS_MAP.get(predicted_class, 0)
            
            return {
                'success': True,
                'wasteType': predicted_class.title(),
                'confidence': confidence_score,
                'recyclable': is_recyclable,
                'points': points
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

# Initialize classifier
classifier = TrashClassifier('trashnet_resnet18.pth')

@app.route('/')
def home():
    return jsonify({
        'status': 'TrashNet Model Service Running',
        'endpoint': '/classify',
        'classes': CLASSES
    })

@app.route('/classify', methods=['POST'])
def classify_waste():
    try:
        data = request.json
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image provided'})
        
        result = classifier.predict(image_data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(host='localhost', port=5001, debug=True)