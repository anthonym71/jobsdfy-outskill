const appUrlInput = document.getElementById('app-url');
const saveBtn = document.getElementById('save-btn');
const sendBtn = document.getElementById('send-btn');
const editBtn = document.getElementById('edit-btn');
const configSection = document.getElementById('config-section');
const connectedSection = document.getElementById('connected-section');
const savedUrlEl = document.getElementById('saved-url');
const statusEl = document.getElementById('status');

const DEFAULT_APP_URL = 'https://jobsdfy.com';
  const fixUrl = (u) => (!u || /lovable|www\.jobsdfy\.com/.test(u)) ? DEFAULT_APP_URL : u;

function setStatus(text, type = '') {
  statusEl.textContent = text;
  statusEl.className = 'status ' + type;
}

// Load saved URL — default to jobsdfy.com
chrome.storage.local.get(['appUrl'], (result) => {
  if (result.appUrl && fixUrl(result.appUrl) === result.appUrl) {
    showConnected(result.appUrl);
  } else {
    // Auto-save the default URL
    chrome.storage.local.set({ appUrl: DEFAULT_APP_URL }, () => {
      showConnected(DEFAULT_APP_URL);
    });
  }
});

saveBtn.addEventListener('click', () => {
  let url = appUrlInput.value.trim();
  if (!url) return setStatus('Please enter your app URL', 'error');
  url = url.replace(/\/+$/, '');
  chrome.storage.local.set({ appUrl: url }, () => {
    showConnected(url);
    setStatus('Connected!', 'success');
  });
});

editBtn.addEventListener('click', () => {
  configSection.style.display = 'block';
  connectedSection.style.display = 'none';
  chrome.storage.local.get(['appUrl'], (r) => { appUrlInput.value = r.appUrl || DEFAULT_APP_URL; });
});

sendBtn.addEventListener('click', async () => {
  sendBtn.disabled = true;
  setStatus('Extracting page content…');
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selectors = [
          '.jobs-search__job-details--container', '.jobs-details', '#job-details', '.jobs-description__content', '.jobsearch-JobComponent', '#jobDescriptionText',
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
    
    const baseUrl = fixUrl(appUrl).replace(/\/+$/, '');
    const params = new URLSearchParams({
      source: 'extension',
      text: result.text.slice(0, 6000),
      url: result.url || '',
      title: result.title || '',
    });
    const targetUrl = `${baseUrl}/app/new-job?${params.toString()}`;
    
    chrome.tabs.create({ url: targetUrl });
    setStatus('Sent! Opening JobsDFY…', 'success');
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
