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

function sendToBackground(text) {
  console.log('Sending text to background:', text);
  chrome.runtime.sendMessage({
    type: 'ANALYZE_TEXT',
    text: text
  }, response => {
    console.log('Background response:', response);
  });
}

// Debounced version of sendToBackground with 3 second delay
const debouncedSendToBackground = debounce(sendToBackground, 3000);

function logInputActivity(event) {
  const element = event.target;
  const text = event.target.value;
  
  console.log('logInputActivity called:', {
    element: element.tagName,
    id: element.id,
    text: text,
    timestamp: new Date().toISOString()
  });
  
  // Send to background after debounce
  debouncedSendToBackground(text);
}

// Listen for input events on any input field or textarea
document.addEventListener('input', event => {
  console.log('Input event detected:', event);
  logInputActivity(event);
});

console.log('Content script initialized');
