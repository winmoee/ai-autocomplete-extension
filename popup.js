document.getElementById('openDebug').addEventListener('click', () => {
    chrome.tabs.create({
      url: 'hello.html'
    });
  });
  