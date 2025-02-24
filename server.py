from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from aixplain.factories import ModelFactory
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Simple CORS configuration
CORS(app)

# Configure AIxplain
model = ModelFactory.get("669a63646eb56306647e1091")

@app.route('/analyze', methods=['POST', 'OPTIONS'])
def analyze():
    # Handle preflight request
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    logger.debug('Received request: %s', request)
    logger.debug('Request headers: %s', request.headers)
    
    data = request.json
    logger.debug('Received data: %s', data)
    
    text = data.get('text', '')
    logger.debug('Text to analyze: %s', text)
    
    try:
        logger.debug('Calling AIxplain model...')
        response = model.run("You are an AI suggestion model to help complete the user's input (suggestions after the user has typed, include space if necessary). Please limit yourself to one sentence, make it brief and put your suggested response in { } so that I can extract your output. User Input: " + text)
        
        # Extract the necessary data from ModelResponse
        response_data = {
            'data': str(response.data),
            'status': response.status,
            'completed': response.completed,
            'runTime': response.run_time,
            'usedCredits': response.used_credits,
            'usage': response.usage
        }
        
        logger.debug('Processed response: %s', response_data)
        
        headers = {'Access-Control-Allow-Origin': '*'}
        return jsonify({
            'success': True,
            'response': response_data
        }), 200, headers
    
    except Exception as e:
        logger.error('Error processing request: %s', str(e), exc_info=True)
        headers = {'Access-Control-Allow-Origin': '*'}
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500, headers

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001) 