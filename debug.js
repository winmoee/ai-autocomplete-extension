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

// Listen for messages from both content script and background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Debug page received message:', message);
  
  if (message.type === 'INPUT_ACTIVITY') {
    statusElement.textContent = 'Receiving input events';
    addLogEntry(message.data);
    // Acknowledge receipt
    sendResponse({received: true});
    return true;
  }
});

