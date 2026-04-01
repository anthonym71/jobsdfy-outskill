const appUrlInput = document.getElementById('app-url');
const saveBtn = document.getElementById('save-btn');
const sendBtn = document.getElementById('send-btn');
const editBtn = document.getElementById('edit-btn');
const configSection = document.getElementById('config-section');
const connectedSection = document.getElementById('connected-section');
const savedUrlEl = document.getElementById('saved-url');
const statusEl = document.getElementById('status');

function setStatus(text, type = '') {
  statusEl.textContent = text;
  statusEl.className = 'status ' + type;
}

// Load saved URL
chrome.storage.local.get(['appUrl'], (result) => {
  if (result.appUrl) {
    showConnected(result.appUrl);
  }
});

saveBtn.addEventListener('click', () => {
  const url = appUrlInput.value.trim();
  if (!url) return setStatus('Please enter your app URL', 'error');
  chrome.storage.local.set({ appUrl: url }, () => {
    showConnected(url);
    setStatus('Connected!', 'success');
  });
});

editBtn.addEventListener('click', () => {
  configSection.style.display = 'block';
  connectedSection.style.display = 'none';
  chrome.storage.local.get(['appUrl'], (r) => { appUrlInput.value = r.appUrl || ''; });
});

sendBtn.addEventListener('click', async () => {
  sendBtn.disabled = true;
  setStatus('Extracting page content…');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Try to get the main job content
        const selectors = [
          '.jobs-description__content',
          '.job-view-layout',
          '[class*="job-details"]',
          '[class*="jobDescription"]',
          'main',
          'article',
          'body'
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.innerText.length > 100) {
            return { text: el.innerText, url: window.location.href, title: document.title };
          }
        }
        return { text: document.body.innerText, url: window.location.href, title: document.title };
      }
    });
    
    if (!result?.text || result.text.length < 50) {
      setStatus('Could not extract page content.', 'error');
      sendBtn.disabled = false;
      return;
    }

    const { appUrl } = await chrome.storage.local.get(['appUrl']);
    
    // Navigate to the app with the text as a URL parameter
    const encoded = encodeURIComponent(result.text.slice(0, 15000));
    const targetUrl = `${appUrl}/app/new-job?source=extension&text=${encoded}`;
    
    chrome.tabs.create({ url: targetUrl });
    setStatus('Sent! Opening AI Job OS…', 'success');
  } catch (err) {
    setStatus('Error: ' + err.message, 'error');
  }
  sendBtn.disabled = false;
});

function showConnected(url) {
  configSection.style.display = 'none';
  connectedSection.style.display = 'block';
  savedUrlEl.textContent = url;
}
