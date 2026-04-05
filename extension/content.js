// Inject a floating "Send to AI Job OS" button on LinkedIn/Indeed job pages
(function() {
  if (document.getElementById('aijos-fab')) return;

  const btn = document.createElement('button');
  btn.id = 'aijos-fab';
  btn.innerHTML = '✦ Send to AI Job OS';
  btn.title = 'Extract this job and send to AI Job OS';
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
      if (!result.appUrl) {
        btn.innerHTML = '✦ Set up extension first';
        btn.disabled = false;
        setTimeout(() => { btn.innerHTML = '✦ Send to AI Job OS'; }, 2000);
        return;
      }

      const encoded = encodeURIComponent(text.slice(0, 15000));
      const baseUrl = result.appUrl.replace(/\/+$/, '');
      const targetUrl = `${baseUrl}/app/new-job?source=extension&text=${encoded}`;
      window.open(targetUrl, '_blank');

      btn.innerHTML = '✓ Sent!';
      setTimeout(() => {
        btn.innerHTML = '✦ Send to AI Job OS';
        btn.disabled = false;
      }, 2000);
    });
  });
})();
