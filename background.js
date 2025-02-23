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
          // Check if tab exists before sending
          chrome.tabs.get(tab.id)
            .then(() => {
              // Wrap sendMessage in try-catch
              try {
                chrome.tabs.sendMessage(tab.id, message)
                  .then(response => {
                    console.log('Message sent to debug page:', response);
                  })
                  .catch(error => {
                    console.log(`Failed to send message to tab ${tab.id}:`, error);
                    // Remove tab from debug tabs if it's no longer valid
                    debugTabs.delete(tab.id);
                  });
              } catch (error) {
                console.log(`Error sending message to tab ${tab.id}:`, error);
              }
            })
            .catch(error => {
              console.log(`Tab ${tab.id} no longer exists:`, error);
              debugTabs.delete(tab.id);
            });
        }
      });
    });
    
    // Acknowledge receipt to content script
    sendResponse({received: true});
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
  