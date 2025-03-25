from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import XLMRobertaTokenizer, XLMRobertaModel
from torch import nn
import re

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)  # Allow all origins

# Set the device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

# Define model architecture (same as in the first script)
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
        
        # Use the [CLS] token representation
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

# Load your custom weights
print("Loading saved model weights...")
try:
    model.load_state_dict(torch.load('best_multilingual_agriculture_model.pt', map_location=device))
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")

# Text sanitization function
def sanitize_input(text):
    """Basic text sanitization"""
    if not text:
        return ""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    return text

# Function to use the model for inference (from the first script)
def predict_scores(model, tokenizer, text, device):
    model.eval()
    
    # Tokenize the input text
    encoding = tokenizer(
        text,
        add_special_tokens=True,
        max_length=256,
        padding='max_length',
        truncation=True,
        return_tensors='pt'
    )
    
    # Move to device
    input_ids = encoding['input_ids'].to(device)
    attention_mask = encoding['attention_mask'].to(device)
    
    # Forward pass
    with torch.no_grad():
        outputs = model(input_ids, attention_mask)
    
    # Convert to scores (0-5 range)
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
    # Get input data from the request
    data = request.json
    mission_id = data.get("mission_id")
    
    # Initialize the user's answer as a String variable
    user_answer = data.get("answer", "")
    answer = sanitize_input(user_answer)  # Sanitize the input
    
    # Input validation
    if len(answer) <= 1:
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
    
    # Check word count
    word_count = len(answer.split())
    if word_count < 5:  # Adjust minimum word count as needed
        return jsonify({
            "mission_id": mission_id,
            # "error": "Answer must contain at least 5 words",
            "detailed_scores": {
                "Knowledge_Agriculture_Score": 0.0,
                "Awareness_Local_Agriculture_Score": 0.0,
                "Use_of_Example_Data_Score": 0.0,
                "Average_Score": 0.0
            }
        }), 400

    try:
        # Get scores using the function from the first script
        scores = predict_scores(model, tokenizer, answer, device)
        
        # Calculate average score
        avg_score = sum(scores.values()) / len(scores)
        
        # Round the scores to 2 decimal places
        detailed_scores = {
            "Knowledge_Agriculture_Score": round(scores['Knowledge_Agriculture_Score'], 2),
            "Awareness_Local_Agriculture_Score": round(scores['Awareness_Local_Agriculture_Score'], 2),
            "Use_of_Example_Data_Score": round(scores['Use_of_Example_Data_Score'], 2),
            "Average_Score": round(avg_score, 2)
        }
        
        # Generate qualitative feedback based on average score
        qualitative_assessment = ""
        if avg_score >= 4.0:
            qualitative_assessment = "Excellent understanding of agricultural concepts with strong local context and examples."
        elif avg_score >= 3.0:
            qualitative_assessment = "Good understanding with some local context and examples."
        elif avg_score >= 2.0:
            qualitative_assessment = "Basic understanding with limited local context or examples."
        else:
            qualitative_assessment = "Limited understanding. Could benefit from more specific knowledge, local context, and examples."
        
        # Return the result
        return jsonify({
            "mission_id": mission_id,
            "detailed_scores": detailed_scores,
            "qualitative_assessment": qualitative_assessment
        })
        
    except Exception as e:
        print(f"Inference error: {str(e)}")
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)