console.log('Content script loaded');

function logInputActivity(event) {
  const element = event.target;
  const message = {
    type: 'INPUT_ACTIVITY',
    data: `Input detected in ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''} - Text: "${event.target.value}"`
  };
  
  console.log('Content script sending message:', message);
  
  // Send message to background script
  chrome.runtime.sendMessage(message, response => {
    console.log('Content script received response:', response);
  });
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
