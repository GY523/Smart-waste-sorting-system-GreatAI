import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image
import os

# Check if model file exists
model_path = 'trashnet_resnet18.pth'
if not os.path.exists(model_path):
    print(f"❌ Model file not found: {model_path}")
    exit(1)

print(f"✅ Model file found: {model_path}")

# TrashNet classes
CLASSES = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']

try:
    # Load model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    
    model = models.resnet18(pretrained=False)
    model.fc = nn.Linear(model.fc.in_features, len(CLASSES))
    
    # Load state dict
    state_dict = torch.load(model_path, map_location=device)
    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()
    
    print("✅ Model loaded successfully!")
    print(f"Model classes: {CLASSES}")
    print("Model is ready for inference")
    
except Exception as e:
    print(f"❌ Error loading model: {e}")
    print("This might be a model compatibility issue")