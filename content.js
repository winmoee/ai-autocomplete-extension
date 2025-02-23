function logInputActivity(event) {
    const element = event.target;
    const message = {
      type: 'INPUT_ACTIVITY',
      data: `Input detected in ${element.tagName.toLowerCase()}${element.id ? '#' + element.id : ''} - Text: "${event.target.value}"`
    };
    
    chrome.runtime.sendMessage(message);
  }

  // Listen for input events on any input field or textarea
document.addEventListener('input', logInputActivity);
