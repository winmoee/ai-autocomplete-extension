console.log('Background service worker initialized');

// Keep track of debug page tabs
let debugTabs = new Set();

function sendToServer(text) {
  console.log('Background script sending to server:', text);
  
  if (!text || text.trim() === '') {
    console.log('Empty text, skipping server request');
    return Promise.resolve({ success: false, error: 'Empty text' });
  }

  const url = 'http://localhost:5001/analyze';
  console.log('Attempting fetch to:', url);
  
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'omit',
    body: JSON.stringify({ text: text })
  })
  .then(response => {
    console.log('Raw response from server:', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .catch(error => {
    console.error('Error in sendToServer:', error);
    console.error('Error stack:', error.stack);
    throw error;
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  if (message.type === 'ANALYZE_TEXT') {
    // Send to server and handle response
    sendToServer(message.text)
      .then(data => {
        console.log('Server response:', data);
        
        // Broadcast to debug pages
        chrome.tabs.query({}, tabs => {
          tabs.forEach(tab => {
            if (tab.url && tab.url.includes('hello.html')) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'INPUT_ACTIVITY',
                data: `Input analyzed: "${message.text}" - Response: ${JSON.stringify(data)}`
              })
                .then(response => {
                  console.log('Message sent to debug page:', response);
                })
                .catch(error => {
                  console.error('Error sending to debug page:', error);
                });
            }
          });
        });
        
        // Send response back to content script
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Error:', error);
        sendResponse({ success: false, error: error.message });
      });
    
    // Return true to indicate we'll send response asynchronously
    return true;
  }
});

// Listen for debug page connections
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'debug_connection') {
    console.log('Debug page connected');
    const tabId = port.sender.tab.id;
    debugTabs.add(tabId);
    
    port.onDisconnect.addListener(() => {
      console.log('Debug page disconnected');
      debugTabs.delete(tabId);
    });
  }
});
  