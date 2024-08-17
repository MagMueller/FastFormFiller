document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.sync.get('contextText', function (data) {
      document.getElementById('context').value = data.contextText || '';
    });
  });
  
  document.getElementById('save').addEventListener('click', function () {
    const contextText = document.getElementById('context').value;
    chrome.storage.sync.set({ contextText: contextText }, function () {
      alert('Context text saved!');
    });
  });
  