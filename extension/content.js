(function() {
  if (document.getElementById('aijos-fab')) return;

  const DEFAULT_APP_URL = 'https://www.jobsdfy.com';

  const btn = document.createElement('button');
  btn.id = 'aijos-fab';
  btn.innerHTML = '✦ Send to JobsDFY';
  btn.title = 'Extract this job and send to JobsDFY';
  document.body.appendChild(btn);

  btn.addEventListener('click', async () => {
    btn.textContent = '⏳ Sending…';
    btn.disabled = true;

    const selectors = [
      '.jobs-description__content',
      '.job-view-layout',
      '[class*="job-details"]',
      '[class*="jobDescription"]',
      'main',
      'article',
      'body'
    ];

    let text = '';
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.innerText.length > 100) {
        text = el.innerText;
        break;
      }
    }

    if (!text) text = document.body.innerText;

    chrome.storage.local.get(['appUrl'], (result) => {
      const appUrl = result.appUrl || DEFAULT_APP_URL;
      const baseUrl = appUrl.replace(/\/+$/, '');
      const params = new URLSearchParams({
        source: 'extension',
        text: text.slice(0, 15000),
        url: window.location.href,
        title: document.title,
      });
      const targetUrl = `${baseUrl}/app/new-job?${params.toString()}`;
      window.open(targetUrl, '_blank');

      btn.innerHTML = '✓ Sent!';
      setTimeout(() => {
        btn.innerHTML = '✦ Send to JobsDFY';
        btn.disabled = false;
      }, 2000);
    });
  });
})();
