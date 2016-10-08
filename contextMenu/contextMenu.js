chrome.runtime.onInstalled.addListener(() => {
  // Create the context menu
  chrome.contextMenus.create({
    title: 'Search MLB Players: %s',
    contexts: ['selection'],
    id: 'BaseballSearch'
  });
});

chrome.contextMenus.onClicked.addListener(searchMLB);
