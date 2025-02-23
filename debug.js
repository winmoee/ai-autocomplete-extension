let logContainer = document.getElementById('logContainer');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INPUT_ACTIVITY') {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message.data}`;
    logContainer.insertBefore(logEntry, logContainer.firstChild);
  }
});
