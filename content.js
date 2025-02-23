console.log('Content script loaded');

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function sendToServer(text) {
  console.log('Sending to server, text:', text);  // Debug log
  fetch('http://localhost:5000/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: text })
  })
  .then(response => {
    console.log('Raw response from server:', response);  // Debug log
    return response.json();
  })
  .then(data => {
    console.log('Parsed response from server:', data);  // Debug log
    // Send message to background script
    chrome.runtime.sendMessage({
      type: 'INPUT_ACTIVITY',
      data: `Input analyzed: "${text}" - Response: ${JSON.stringify(data)}`
    }, response => {
      console.log('Background script response:', response);  // Debug log
    });
  })
  .catch(error => {
    console.error('Error in sendToServer:', error);  // More detailed error logging
    console.error('Error stack:', error.stack);  // Stack trace
  });
}

// Debounced version of sendToServer with 3 second delay
const debouncedSendToServer = debounce(sendToServer, 3000);

function logInputActivity(event) {
  const element = event.target;
  const text = event.target.value;
  
  console.log(`Input detected in ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''}`);
  
  // Send to server after debounce
  debouncedSendToServer(text);
}

// Listen for input events on any input field or textarea
document.addEventListener('input', event => {
  console.log('Input event detected:', event);
  logInputActivity(event);
});

// Log that content script is initialized
console.log('Content script initialized');

// background.js
console.log('Background service worker initialized');

// Keep track of debug page tabs
let debugTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'INPUT_ACTIVITY') {
    // Broadcast to all debug pages
    chrome.tabs.query({}, tabs => {
      tabs.forEach(tab => {
        if (tab.url && tab.url.includes('hello.html')) {
          chrome.tabs.sendMessage(tab.id, message)
            .then(response => {
              console.log('Message sent to debug page:', response);
            })
            .catch(error => {
              console.error('Error sending to debug page:', error);
            });
        }
      });
    });
    
    // Acknowledge receipt to content script
    sendResponse({received: true});
    return true;
  }
});
