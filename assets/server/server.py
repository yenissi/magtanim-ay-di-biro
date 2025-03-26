# server.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import XLMRobertaTokenizer, XLMRobertaModel
from torch import nn
import re
import os
import gdown

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Set the device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Define model architecture
class MultilingualAgricultureModel(nn.Module):
    def __init__(self, num_labels=3):
        super(MultilingualAgricultureModel, self).__init__()
        self.xlm_roberta = XLMRobertaModel.from_pretrained('xlm-roberta-base')
        self.dropout = nn.Dropout(0.1)
        self.classifier = nn.Linear(self.xlm_roberta.config.hidden_size, num_labels)
        
    def forward(self, input_ids, attention_mask):
        outputs = self.xlm_roberta(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        pooled_output = outputs.last_hidden_state[:, 0, :]
        pooled_output = self.dropout(pooled_output)
        logits = self.classifier(pooled_output)
        return logits

# Load the tokenizer
print("Loading XLM-RoBERTa tokenizer...")
tokenizer = XLMRobertaTokenizer.from_pretrained('xlm-roberta-base')

# Initialize and load the model
print("Initializing model...")
model = MultilingualAgricultureModel().to(device)

MODEL_PATH = "best_multilingual_agriculture_model.pt"
MODEL_URL = "https://drive.google.com/uc?id=1cGJdQmkUQplEd0ZDr1wjgdYSMf2u9Zru"

# Download the model if it doesn't exist
if not os.path.exists(MODEL_PATH):
    print("Downloading model file...")
    try:
        gdown.download(MODEL_URL, MODEL_PATH, quiet=False)
        print("Model downloaded successfully!")
    except Exception as e:
        print(f"Error downloading model: {e}")
        raise Exception("Failed to download the model file. Cannot proceed.")

# Load your custom weights
print("Loading saved model weights...")
try:
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    raise Exception(f"Failed to load the model: {e}")

# Text sanitization function
def sanitize_input(text):
    if not text:
        return ""
    text = re.sub(r'\s+', ' ', text.strip())
    return text

# Prediction function
def predict_scores(model, tokenizer, text, device):
    model.eval()
    encoding = tokenizer(
        text,
        add_special_tokens=True,
        max_length=256,
        padding='max_length',
        truncation=True,
        return_tensors='pt'
    )
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)
    
    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
    
    knowledge_score = min(max(outputs[0, 0].item() * 5, 0), 5)
    awareness_score = min(max(outputs[0, 1].item() * 5, 0), 5)
    example_score = min(max(outputs[0, 2].item() * 5, 0), 5)
    
    return {
        'Knowledge_Agriculture_Score': knowledge_score,
        'Awareness_Local_Agriculture_Score': awareness_score,
        'Use_of_Example_Data_Score': example_score
    }

@app.route("/process-answer", methods=["POST"])
def process_answer():
    data = request.json
    mission_id = data.get("mission_id")
    user_answer = data.get("answer", "")
    answer = sanitize_input(user_answer)
    
    if len(answer) <= 1 or len(answer.split()) < 5:
        return jsonify({
            "mission_id": mission_id,
            "error": "Answer too short",
            "detailed_scores": {
                "Knowledge_Agriculture_Score": 0.0,
                "Awareness_Local_Agriculture_Score": 0.0,
                "Use_of_Example_Data_Score": 0.0,
                "Average_Score": 0.0
            }
        }), 400
    
    try:
        scores = predict_scores(model, tokenizer, answer, device)
        avg_score = sum(scores.values()) / len(scores)
        
        detailed_scores = {
            "Knowledge_Agriculture_Score": round(scores['Knowledge_Agriculture_Score'], 2),
            "Awareness_Local_Agriculture_Score": round(scores['Awareness_Local_Agriculture_Score'], 2),
            "Use_of_Example_Data_Score": round(scores['Use_of_Example_Data_Score'], 2),
            "Average_Score": round(avg_score, 2)
        }
        
        qualitative_assessment = ""
        if avg_score >= 4.0:
            qualitative_assessment = "Excellent understanding of agricultural concepts with strong local context and examples."
        elif avg_score >= 3.0:
            qualitative_assessment = "Good understanding with some local context and examples."
        elif avg_score >= 2.0:
            qualitative_assessment = "Basic understanding with limited local context or examples."
        else:
            qualitative_assessment = "Limited understanding. Could benefit from more specific knowledge, local context, and examples."
        
        return jsonify({
            "mission_id": mission_id,
            "detailed_scores": detailed_scores,
            "qualitative_assessment": qualitative_assessment,
            "predictions": scores  # Include raw predictions for reference
        })
        
    except Exception as e:
        return jsonify({
            "mission_id": mission_id,
            "error": str(e),
            "detailed_scores": {
                "Knowledge_Agriculture_Score": 0.0,
                "Awareness_Local_Agriculture_Score": 0.0,
                "Use_of_Example_Data_Score": 0.0,
                "Average_Score": 0.0
            }
        }), 500

@app.route("/")
def home():
    return "Agriculture Answer Scoring API is running!"

if __name__ == "__main__":
    app.run()