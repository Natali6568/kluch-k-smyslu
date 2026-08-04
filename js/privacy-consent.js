(function () {
  const POLICY_URL = 'https://disk.yandex.ru/i/u-xHfCY8ayEEOA';
  const CONSENT_URL = 'https://disk.yandex.ru/i/1G_gMPejWT0cag';

  function addStyles() {
    if (document.getElementById('privacy-consent-styles')) return;

    const style = document.createElement('style');
    style.id = 'privacy-consent-styles';
    style.textContent = `
      .privacy-consent-wrap{display:grid;gap:8px;margin:2px 0 0}
      .privacy-consent-row{display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:start;font-size:13px;line-height:1.5;color:var(--muted,#6d7278)}
      .privacy-consent-row input{width:18px;height:18px;margin:2px 0 0;accent-color:var(--accent,#ed963b);cursor:pointer}
      .privacy-consent-row label{cursor:pointer}
      .privacy-consent-row a,.legal-footer a{color:var(--accent,#c96f16);text-decoration:underline;text-underline-offset:2px}
      .privacy-consent-error{display:none;border-radius:13px;padding:10px 12px;background:#fde5e1;color:#7a241d;font-size:13px;line-height:1.4}
      .privacy-consent-error.visible{display:block}
      .legal-footer{max-width:1120px;margin:-38px auto 0;padding:0 18px 28px;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:8px;color:var(--muted,#6d7278);font-size:12px;line-height:1.45;text-align:center}
      .dark .privacy-consent-error{background:#5a302d;color:#ffd8d3}
      @media(max-width:560px){.legal-footer{margin-top:-42px;padding-bottom:22px}}
    `;
    document.head.appendChild(style);
  }

  function getSubmit(form) {
    return form.querySelector('.auth-submit, button[type="submit"]');
  }

  function isRegistrationMode(form) {
    const activeTab = document.querySelector('.auth-tab.active');
    const submit = getSubmit(form);
    const surroundingText = form.closest('.auth-card, .auth-shell')?.textContent || '';
    const text = `${activeTab?.textContent || ''} ${submit?.textContent || ''} ${surroundingText}`;
    return /(регист|создать\s+аккаунт|зарегистрироваться)/i.test(text) && !/(войти|вход)\s*$/i.test(submit?.textContent || '');
  }

  function createBlock() {
    const wrap = document.createElement('div');
    wrap.className = 'privacy-consent-wrap';
    wrap.innerHTML = `
      <div class="privacy-consent-row">
        <input type="checkbox" class="personal-data-consent" required>
        <div>
          <label>Я даю </label><a href="${CONSENT_URL}" target="_blank" rel="noopener noreferrer">согласие на обработку персональных данных</a>
          <label> и подтверждаю, что ознакомился(лась) с </label><a href="${POLICY_URL}" target="_blank" rel="noopener noreferrer">Политикой в отношении обработки персональных данных</a>.
        </div>
      </div>
      <div class="privacy-consent-error" role="alert" aria-live="polite">Чтобы зарегистрироваться, необходимо дать согласие на обработку персональных данных.</div>
    `;

    const checkbox = wrap.querySelector('.personal-data-consent');
    const labels = wrap.querySelectorAll('label');
    labels.forEach(function (label) {
      label.addEventListener('click', function () {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    checkbox.addEventListener('change', function () {
      if (checkbox.checked) wrap.querySelector('.privacy-consent-error').classList.remove('visible');
    });
    return wrap;
  }

  function sync() {
    document.querySelectorAll('form.auth-form, .auth-form').forEach(function (form) {
      const existing = form.querySelector('.privacy-consent-wrap');
      if (!isRegistrationMode(form)) {
        if (existing) existing.remove();
        return;
      }
      if (existing) return;
      const block = createBlock();
      const submit = getSubmit(form);
      if (submit) form.insertBefore(block, submit);
      else form.appendChild(block);
    });
  }

  function validate(form) {
    if (!isRegistrationMode(form)) return true;
    const checkbox = form.querySelector('.personal-data-consent');
    if (checkbox?.checked) return true;

    sync();
    const block = form.querySelector('.privacy-consent-wrap');
    block?.querySelector('.privacy-consent-error')?.classList.add('visible');
    block?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    checkbox?.focus();
    return false;
  }

  function start() {
    try {
      addStyles();
      sync();

      document.addEventListener('submit', function (event) {
        const form = event.target.closest?.('form.auth-form, .auth-form');
        if (form && !validate(form)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);

      document.addEventListener('click', function (event) {
        const submit = event.target.closest?.('.auth-form .auth-submit, .auth-form button[type="submit"]');
        if (!submit) return;
        const form = submit.closest('form.auth-form, .auth-form');
        if (form && !validate(form)) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }, true);

      const app = document.getElementById('app');
      if (app) {
        new MutationObserver(sync).observe(app, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
      }
    } catch (error) {
      console.error('Не удалось подключить блок согласия:', error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
