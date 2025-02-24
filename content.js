console.log('🚀 CONTENT SCRIPT LOADED - ' + new Date().toISOString());
console.log('📍 If you see this, the content script is working!');

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    console.log('Debounce triggered, waiting', wait, 'ms');
    const later = () => {
      console.log('Debounce timeout finished, executing function');
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function extractSuggestion(response) {
  console.log('Extracting suggestion from:', response);
  
  // Extract text between { and }
  if (response && response.response && response.response.data) {
    const match = response.response.data.match(/{([^}]+)}/);
    const suggestion = match ? match[1].trim() : '';
    console.log('Extracted suggestion:', suggestion);
    return suggestion;
  }
  console.log('No valid response data found');
  return '';
}

function showSuggestion(element, suggestion) {
  console.log('Showing suggestion:', suggestion);
  
  // Create or update suggestion element
  let suggestionEl = element.nextElementSibling;
  if (!suggestionEl || !suggestionEl.classList.contains('ai-suggestion')) {
    suggestionEl = document.createElement('div');
    suggestionEl.classList.add('ai-suggestion');
    suggestionEl.style.cssText = `
      position: absolute;
      background: #f0f0f0;
      border: 1px solid #ccc;
      padding: 5px 10px;
      border-radius: 4px;
      color: #666;
      font-size: 14px;
      z-index: 9999;
      margin-top: 5px;
    `;
    element.parentNode.insertBefore(suggestionEl, element.nextSibling);
  }

  // Store the suggestion for tab completion
  element.dataset.suggestion = suggestion;
  
  // Position below the input
  const rect = element.getBoundingClientRect();
  suggestionEl.style.top = `${rect.bottom + 5}px`;
  suggestionEl.style.left = `${rect.left}px`;
  
  // Show the suggestion
  suggestionEl.textContent = `Press Tab to complete: ${suggestion}`;
}

function sendToBackground(text, element) {
  if (!text || text.trim() === '') {
    console.log('Empty text, skipping background send');
    return;
  }

  console.log('Sending text to background:', text);
  try {
    chrome.runtime.sendMessage({
      type: 'ANALYZE_TEXT',
      text: text
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        return;
      }

      console.log('Background response:', response);
      if (response && response.success) {
        const suggestion = extractSuggestion(response.data);
        if (suggestion) {
          showSuggestion(element, suggestion);
        }
      }
    });
  } catch (error) {
    console.error('Error sending message to background:', error);
  }
}

// Debounced version of sendToBackground with 3 second delay
const debouncedSendToBackground = debounce(sendToBackground, 3000);

function logInputActivity(event) {
  const element = event.target;
  const text = element.value;
  
  console.log('logInputActivity called:', {
    element: element.tagName,
    id: element.id,
    text: text,
    timestamp: new Date().toISOString()
  });
  
  // Send to background after debounce
  debouncedSendToBackground(text, element);
}

// Handle tab key for completion
document.addEventListener('keydown', event => {
  if (event.key === 'Tab' && event.target.dataset.suggestion) {
    event.preventDefault(); // Prevent default tab behavior
    
    const element = event.target;
    const suggestion = element.dataset.suggestion;
    
    // Get cursor position
    const cursorPos = element.selectionStart;
    
    // Insert suggestion at cursor position
    const currentValue = element.value;
    element.value = currentValue.substring(0, cursorPos) + 
                   suggestion + 
                   currentValue.substring(cursorPos);
    
    // Move cursor to end of inserted suggestion
    element.setSelectionRange(cursorPos + suggestion.length, cursorPos + suggestion.length);
    console.log('SUGGESTION WIN');
    
    // Clear the suggestion
    const suggestionEl = element.nextElementSibling;
    if (suggestionEl && suggestionEl.classList.contains('ai-suggestion')) {
      suggestionEl.remove();
    }
    delete element.dataset.suggestion;
  }
});

// Listen for input events on any input field or textarea
document.addEventListener('input', event => {
  console.log('Input event detected:', event);
  logInputActivity(event);
});

console.log('Content script initialized');
