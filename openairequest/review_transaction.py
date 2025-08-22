import os
import openai
import json

# Set your OpenAI API key
openai.api_key = "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"

# Mock transaction payload and user rules
transaction_payload = {
    "amount": 150.0,
    "currency": "USD",
    "merchant": "Coffee Shop",
    "location": "NYC",
    "items": [
        {"name": "Latte", "qty": 2, "price": 5.0},
        {"name": "Bagel", "qty": 1, "price": 3.0}
    ],
    "user_id": "user123"
}

user_rules = "Reject any transaction over $100 unless the merchant is 'Coffee Shop'. Accept all others."

# Compose the prompt
prompt = f"""
You are an AI assistant that reviews transaction payloads based on user rules. 
Transaction payload (as JSON): {json.dumps(transaction_payload)}
User rules: {user_rules}

Decide whether to 'accept' or 'reject' the transaction. Output a JSON object with 'decision' (accept/reject) and 'reason' fields. Only output JSON.
"""

response = openai.chat.completions.create(
    model="gpt-5-nano",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": prompt}
    ],
    max_tokens=256,
    temperature=0.0
)

# Extract and print the JSON output
try:
    output = response.choices[0].message.content.strip()
    result = json.loads(output)
    print(json.dumps(result, indent=2))
except Exception as e:
    print("Error parsing response:", e)
    print("Raw output:", output)
