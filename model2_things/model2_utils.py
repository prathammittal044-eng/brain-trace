import torch
import torch.nn as nn
import torch.nn.functional as F

from PIL import Image

import torchvision.transforms as transforms
from torchvision import models


IMAGE_SIZE = 224

CLASS_NAMES = [
    "Mild Demented",
    "Non Demented",
    "Very Mild Demented"
]

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def load_model(model_path):

    model = models.resnet18(weights=None)

    num_features = model.fc.in_features

    model.fc = nn.Linear(
        num_features,
        len(CLASS_NAMES)
    )

    model.load_state_dict(
        torch.load(
            model_path,
            map_location=device
        )
    )

    model = model.to(device)

    model.eval()

    return model


def preprocess_image(image_path):

    image = Image.open(image_path).convert("RGB")

    image = transform(image)

    image = image.unsqueeze(0)

    return image.to(device)


def predict_image(model, image_tensor):

    with torch.no_grad():

        outputs = model(image_tensor)

        probabilities = F.softmax(
            outputs,
            dim=1
        )

        confidence, predicted = torch.max(
            probabilities,
            dim=1
        )

    predicted_class = CLASS_NAMES[predicted.item()]

    return (
        predicted_class,
        confidence.item(),
        probabilities.squeeze().cpu().numpy()
    )