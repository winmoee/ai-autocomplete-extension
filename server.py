from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from aixplain.factories import ModelFactory
import logging

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure AIxplain
model = ModelFactory.get("669a63646eb56306647e1091")

@app.route('/analyze', methods=['POST'])
def analyze():
    logger.debug('Received request: %s', request)
    logger.debug('Request headers: %s', request.headers)
    
    data = request.json
    logger.debug('Received data: %s', data)
    
    text = data.get('text', '')
    logger.debug('Text to analyze: %s', text)
    
    try:
        logger.debug('Calling AIxplain model...')
        response = model.run(text)
        logger.debug('AIxplain response: %s', response)
        
        result = {
            'success': True,
            'response': response
        }
        logger.debug('Sending response: %s', result)
        return jsonify(result)
    
    except Exception as e:
        logger.error('Error processing request: %s', str(e), exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True) 