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
      position: fixed;
      background: #f0f0f0;
      border: 1px solid #ccc;
      padding: 8px 15px;  /* Increased padding */
      border-radius: 4px;
      color: #666;
      font-size: 16px;  /* Increased font size */
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);  /* Enhanced shadow */
      pointer-events: none;
      min-width: 200px;  /* Minimum width */
      max-width: 400px;  /* Maximum width */
      backdrop-filter: blur(5px);  /* Slight blur effect */
      background: rgba(240, 240, 240, 0.95);  /* Slightly transparent */
    `;
    document.body.appendChild(suggestionEl);
  }

  // Store the suggestion for tab completion
  element.dataset.suggestion = suggestion;
  
  // Position right below the input
  const rect = element.getBoundingClientRect();
  suggestionEl.style.top = `${rect.bottom + window.scrollY}px`;  // Removed gap
  suggestionEl.style.left = `${rect.left + window.scrollX}px`;
  
  // Show the suggestion
  suggestionEl.textContent = `Press Tab to complete: ${suggestion}`;
}

function showLoadingIndicator(element) {
  // Create or update loading element
  let loadingEl = document.querySelector('.ai-suggestion.loading');
  if (!loadingEl) {
    loadingEl = document.createElement('div');
    loadingEl.classList.add('ai-suggestion', 'loading');
    loadingEl.style.cssText = `
      position: fixed;
      background: rgba(240, 240, 240, 0.95);
      border: 1px solid #ccc;
      padding: 8px 15px;  /* Increased padding */
      border-radius: 4px;
      color: #666;
      font-size: 16px;  /* Increased font size */
      z-index: 2147483647;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);  /* Enhanced shadow */
      pointer-events: none;
      min-width: 200px;  /* Minimum width */
      backdrop-filter: blur(5px);  /* Slight blur effect */
    `;
    document.body.appendChild(loadingEl);
  }

  // Position right below the input
  const rect = element.getBoundingClientRect();
  loadingEl.style.top = `${rect.bottom + window.scrollY}px`;  // Removed gap
  loadingEl.style.left = `${rect.left + window.scrollX}px`;
  
  // Show loading animation with larger text
  loadingEl.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="margin-right: 12px; font-weight: 500;">Thinking</div>
      <div class="dots" style="font-size: 20px;">
        <span>.</span><span>.</span><span>.</span>
      </div>
    </div>
    <style>
      .dots span {
        animation: dots 1.5s infinite;
        opacity: 0;
      }
      .dots span:nth-child(2) { animation-delay: 0.5s; }
      .dots span:nth-child(3) { animation-delay: 1s; }
      @keyframes dots {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
    </style>
  `;
}

function removeLoadingIndicator(element) {
  const loadingEl = document.querySelector('.ai-suggestion.loading');
  if (loadingEl) {
    loadingEl.remove();
  }
}

function sendToBackground(text, element) {
  if (!text || text.trim() === '') {
    console.log('Empty text, skipping background send');
    return;
  }

  console.log('Sending text to background:', text);
  try {
    showLoadingIndicator(element);  // Show loading indicator
    
    chrome.runtime.sendMessage({
      type: 'ANALYZE_TEXT',
      text: text
    }, response => {
      removeLoadingIndicator(element);  // Remove loading indicator
      
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
    removeLoadingIndicator(element);  // Remove loading indicator on error
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

// Function to attach input listeners to an element
function attachInputListeners(element) {
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    console.log('Attaching listeners to:', element);
    element.addEventListener('input', logInputActivity);
  }
}

// Function to handle newly added nodes
function handleAddedNodes(addedNodes) {
  addedNodes.forEach(node => {
    // Check if the node itself is an input/textarea
    if (node.nodeType === 1) { // Element node
      attachInputListeners(node);
    }
    
    // Check child elements if it's a container
    if (node.querySelectorAll) {
      const inputs = node.querySelectorAll('input, textarea');
      inputs.forEach(input => attachInputListeners(input));
    }
  });
}

// Create and start the MutationObserver
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes.length) {
      handleAddedNodes(mutation.addedNodes);
    }
  });
});

// Start observing the document with the configured parameters
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial scan for existing inputs
const existingInputs = document.querySelectorAll('input, textarea');
existingInputs.forEach(input => attachInputListeners(input));

console.log('Content script initialized with MutationObserver');
