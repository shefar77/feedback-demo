(function () {
  const currentScript = document.currentScript;
  const placeId  = currentScript?.getAttribute("ChIJK9ZfSh-6bTkRJUzXVIgzQTc");
  const biz      = encodeURIComponent(currentScript?.getAttribute('data-biz') ?? 'My Business');
  const category = currentScript?.getAttribute('data-category') ?? 'retail';
  const lang     = currentScript?.getAttribute('data-lang') ?? 'en';
  const appUrl   = currentScript?.getAttribute('data-app-url') ?? 'https://feedback-portal-gules-kappa.vercel.app/';

  const btn = document.createElement('button');
  btn.textContent = '★ Give Feedback';
  btn.style.cssText = [
    'display:inline-flex', 'align-items:center', 'gap:8px',
    'background:#c8441a', 'color:#fff',
    'border:none', 'padding:10px 20px', 'border-radius:24px',
    'font-size:14px', 'font-weight:500', 'cursor:pointer',
    'box-shadow:0 4px 14px rgba(200,68,26,0.35)',
    'transition:transform 0.15s, box-shadow 0.15s',
    'font-family:system-ui,sans-serif',
  ].join(';');

  btn.onmouseover = () => {
    btn.style.transform = 'translateY(-2px)';
    btn.style.boxShadow = '0 6px 20px rgba(200,68,26,0.4)';
  };
  btn.onmouseleave = () => {
    btn.style.transform = '';
    btn.style.boxShadow = '0 4px 14px rgba(200,68,26,0.35)';
  };

  btn.onclick = () => {
    const url = `${appUrl}/feedback/${placeId}?biz=${biz}&category=${category}&lang=${lang}`;
    window.open(url, '_blank', 'width=640,height=720,scrollbars=yes');
  };

  // Insert after script tag
  currentScript?.parentNode?.insertBefore(btn, currentScript.nextSibling);
})();