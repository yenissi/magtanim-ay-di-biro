from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
from transformers import XLMRobertaTokenizer, XLMRobertaForSequenceClassification
import re

# Initialize Flask app
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)  # Allow all origins

# Load the tokenizer
tokenizer = XLMRobertaTokenizer.from_pretrained("xlm-roberta-base")

# Load the base model
model = XLMRobertaForSequenceClassification.from_pretrained("xlm-roberta-base", num_labels=5)

# Load your custom weights
model_path = "best_multilingual_agriculture_model.pt"
state_dict = torch.load(model_path)

# Rename keys in the state_dict (if necessary)
new_state_dict = {}
for key, value in state_dict.items():
    if key.startswith("xlm_roberta."):
        new_key = key.replace("xlm_roberta.", "roberta.")
        new_state_dict[new_key] = value
    else:
        new_state_dict[key] = value

# Load the modified state_dict
model.load_state_dict(new_state_dict, strict=False)
model.eval()

# Add debugging info
print("Model loaded successfully")
print(f"Model output dimensions: {model.config.hidden_size}, Labels: {model.config.num_labels}")

# Text sanitization function
def sanitize_input(text):
    """Basic text sanitization"""
    if not text:
        return ""
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    return text

# Score calculation functions on a 0-5 scale
def calculate_knowledge_score(predictions):
    """Calculate agriculture knowledge score based on the highest probability class (0-5 scale)"""
    max_class = predictions[0].index(max(predictions[0]))  # Get the class with the highest probability
    return max_class + 1  # Map class index (0-4) to score (1-5)

def calculate_awareness_score(predictions):
    """Calculate local agriculture awareness score based on the highest probability class (0-5 scale)"""
    max_class = predictions[0].index(max(predictions[0]))  # Get the class with the highest probability
    return max_class + 1  # Map class index (0-4) to score (1-5)

def calculate_example_data_score(predictions):
    """Calculate score for use of specific examples and data based on the highest probability class (0-5 scale)"""
    max_class = predictions[0].index(max(predictions[0]))  # Get the class with the highest probability
    return max_class + 1  # Map class index (0-4) to score (1-5)

def apply_length_bonus(answer, score):
    """Apply a bonus based on the length of the answer."""
    word_count = len(answer.split())  # Count the number of words in the answer
    
    # Adjust the score based on word count
    if word_count >= 15:  # Long answer
        return min(score + 2, 5)  # Add +2 bonus (cap at 5)
    elif word_count >= 10:  # Medium answer
        return min(score + 1, 5)  # Add +1 bonus (cap at 5)
    else:  # Short answer (5 words or more, but less than 10)
        return min(score - 1, 5)

@app.route("/process-answer", methods=["POST"])
def process_answer():
    # Get input data from the request
    data = request.json
    mission_id = data.get("mission_id")
    
    # Initialize the user's answer as a String variable
    user_answer: str = data.get("answer", "")  # Explicitly declare as String
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
            "error": "Answer must contain at least 5 words",
            "detailed_scores": {
                "Knowledge_Agriculture_Score": 0.0,
                "Awareness_Local_Agriculture_Score": 0.0,
                "Use_of_Example_Data_Score": 0.0,
                "Average_Score": 0.0
            }
        }), 400

    # Tokenize the input answer
    inputs = tokenizer(answer, return_tensors="pt", padding=True, truncation=True)

    # Perform inference with additional debugging
    try:
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            print(f"Raw logits shape: {logits.shape}")
            print(f"Raw logits values: {logits}")
            raw_predictions = torch.softmax(logits, dim=-1).tolist()
            print(f"Softmax predictions: {raw_predictions}")
        
        # Calculate detailed scores on 0-5 scale
        knowledge_score = calculate_knowledge_score(raw_predictions)
        awareness_score = calculate_awareness_score(raw_predictions)
        example_data_score = calculate_example_data_score(raw_predictions)
        
        # Apply length-based bonus
        knowledge_score = apply_length_bonus(answer, knowledge_score)
        awareness_score = apply_length_bonus(answer, awareness_score)
        example_data_score = apply_length_bonus(answer, example_data_score)
        
        print(f"Calculated scores - K:{knowledge_score}, A:{awareness_score}, E:{example_data_score}")
        
        # Calculate average score
        average_score = (knowledge_score + awareness_score + example_data_score) / 3
        
        # Prepare detailed scores for response
        detailed_scores = {
            "Knowledge_Agriculture_Score": round(knowledge_score, 1),
            "Awareness_Local_Agriculture_Score": round(awareness_score, 1),
            "Use_of_Example_Data_Score": round(example_data_score, 1),
            "Average_Score": round(average_score, 1)
        }
        
        # Return the result
        return jsonify({
            "mission_id": mission_id,
            "predictions": raw_predictions,
            "detailed_scores": detailed_scores
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