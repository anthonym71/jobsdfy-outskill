(function() {
  if (document.getElementById('aijos-fab')) return;

  const DEFAULT_APP_URL = 'https://jobsdfy.com';
  const fixUrl = (u) => (!u || /lovable|www\.jobsdfy\.com/.test(u)) ? DEFAULT_APP_URL : u;

  const btn = document.createElement('button');
  btn.id = 'aijos-fab';
  btn.innerHTML = '✦ Send to JobsDFY';
  btn.title = 'Extract this job and send to JobsDFY';
  document.body.appendChild(btn);
  // LinkedIn is a single-page app: only show the button on job pages, re-checking as the URL changes
  const onJobPage = () => /\/jobs\//.test(location.pathname) || /indeed\./.test(location.hostname);
  const sync = () => { btn.style.display = onJobPage() ? '' : 'none'; };
  sync(); setInterval(sync, 1000);

  btn.addEventListener('click', async () => {
    btn.textContent = '⏳ Sending…';
    btn.disabled = true;

    const selectors = [
      '.jobs-search__job-details--container', '.jobs-details', '#job-details', '.jobs-description__content', '.jobsearch-JobComponent', '#jobDescriptionText',
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
      const appUrl = fixUrl(result.appUrl);
      const baseUrl = appUrl.replace(/\/+$/, '');
      const params = new URLSearchParams({
        source: 'extension',
        text: text.slice(0, 6000),
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
