// Mouse Gesture Navigation - Background Script

// メッセージリスナーを設定
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action) {
    switch (message.action) {
      case 'closeTab':
        // 現在のタブを閉じる
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.remove(tabs[0].id);
          }
        });
        break;

      case 'reloadTab':
        // 現在のタブを更新する
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.reload(tabs[0].id);
          }
        });
        break;

      case 'goBack':
        // 履歴を戻る
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.goBack(tabs[0].id);
          }
        });
        break;

      case 'goForward':
        // 履歴を進む
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs[0]) {
            chrome.tabs.goForward(tabs[0].id);
          }
        });
        break;
    }
  }
  return true;
});