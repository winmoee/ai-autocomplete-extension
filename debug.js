let logContainer = document.getElementById('logContainer');
let statusElement = document.getElementById('status');

function addLogEntry(text, isDebug = false) {
  const logEntry = document.createElement('div');
  logEntry.className = isDebug ? 'log-entry debug-info' : 'log-entry';
  logEntry.textContent = `${new Date().toLocaleTimeString()} - ${text}`;
  logContainer.insertBefore(logEntry, logContainer.firstChild);
}

// Log that debug page is initialized
addLogEntry('Debug page initialized', true);

// Establish connection with background script
const port = chrome.runtime.connect({ name: 'debug_connection' });

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Debug page received message:', message);
  
  // Update your debug page UI here
  if (message.type === 'INPUT_ACTIVITY') {
    // Handle the message
    const debugOutput = document.getElementById('debug-output');
    if (debugOutput) {
      const entry = document.createElement('div');
      entry.textContent = message.data;
      debugOutput.appendChild(entry);
    }
  }
  
  // Send acknowledgment
  sendResponse({ received: true });
  return true;
});

