chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'INPUT_ACTIVITY') {
      // Forward the message to any open debug pages
      chrome.runtime.sendMessage(message);
    }
  });
  