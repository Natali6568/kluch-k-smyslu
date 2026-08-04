(function () {
  'use strict';

  const POLICY_URL = 'https://disk.yandex.ru/i/u-xHfCY8ayEEOA';
  const CONSENT_URL = 'https://disk.yandex.ru/i/1G_gMPejWT0cag';
  const POLICY_VERSION = '2026-08-04';

  window.__privacyConsentState = {
    accepted: false,
    acceptedAt: null
  };

  function addStyles() {
    if (document.getElementById('privacy-consent-styles')) return;

    const style = document.createElement('style');
    style.id = 'privacy-consent-styles';
    style.textContent = `
      .privacy-consent-wrap {
        display: grid;
        gap: 8px;
        margin: 2px 0 0;
      }
      .privacy-consent-row {
        display: grid;
        grid-template-columns: 22px 1fr;
        gap: 10px;
        align-items: start;
        font-size: 13px;
        line-height: 1.5;
        color: var(--muted, #6d7278);
      }
      .privacy-consent-row label {
        cursor: pointer;
      }
      .privacy-consent-row input {
        width: 18px;
        height: 18px;
        margin: 2px 0 0;
        accent-color: var(--accent, #ed963b);
        cursor: pointer;
      }
      .privacy-consent-row a,
      .legal-footer a {
        color: var(--accent, #c96f16);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .privacy-consent-row a:hover,
      .legal-footer a:hover {
        text-decoration-thickness: 2px;
      }
      .privacy-consent-error {
        display: none;
        border-radius: 13px;
        padding: 10px 12px;
        background: #fde5e1;
        color: #7a241d;
        font-size: 13px;
        line-height: 1.4;
      }
      .privacy-consent-error.visible {
        display: block;
      }
      .legal-footer {
        max-width: 1120px;
        margin: -38px auto 0;
        padding: 0 18px 28px;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        color: var(--muted, #6d7278);
        font-size: 12px;
        line-height: 1.45;
        text-align: center;
      }
      .dark .privacy-consent-error {
        background: #5a302d;
        color: #ffd8d3;
      }
      @media (max-width: 560px) {
        .legal-footer {
          margin-top: -42px;
          padding-bottom: 22px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isRegistrationMode(form) {
    const activeTab = document.querySelector('.auth-tab.active');
    const activeText = activeTab ? activeTab.textContent : '';
    const submit = form ? form.querySelector('.auth-submit, button[type="submit"]') : null;
    const submitText = submit ? submit.textContent : '';
    return /(регист|создать\s+аккаунт)/i.test(`${activeText} ${submitText}`);
  }

  function resetConsentState() {
    window.__privacyConsentState.accepted = false;
    window.__privacyConsentState.acceptedAt = null;
  }

  function createConsentBlock() {
    const wrap = document.createElement('div');
    wrap.className = 'privacy-consent-wrap';
    wrap.innerHTML = `
      <div class="privacy-consent-row">
        <input type="checkbox" id="personalDataConsent" name="personalDataConsent" required>
        <div>
          <label for="personalDataConsent">Я даю </label><a href="${CONSENT_URL}" target="_blank" rel="noopener noreferrer">согласие на обработку персональных данных</a>
          <label for="personalDataConsent"> и подтверждаю, что ознакомился(лась) с </label><a href="${POLICY_URL}" target="_blank" rel="noopener noreferrer">Политикой в отношении обработки персональных данных</a>.
        </div>
      </div>
      <div class="privacy-consent-error" role="alert" aria-live="polite">
        Чтобы зарегистрироваться, необходимо принять согласие на обработку персональных данных.
      </div>
    `;

    const checkbox = wrap.querySelector('#personalDataConsent');
    checkbox.addEventListener('change', function () {
      const accepted = checkbox.checked;
      window.__privacyConsentState.accepted = accepted;
      window.__privacyConsentState.acceptedAt = accepted ? new Date().toISOString() : null;
      if (accepted) {
        wrap.querySelector('.privacy-consent-error').classList.remove('visible');
      }
    });

    return wrap;
  }

  function syncConsentUi() {
    const forms = document.querySelectorAll('form.auth-form, .auth-form');

    forms.forEach(function (form) {
      const existing = form.querySelector('.privacy-consent-wrap');

      if (!isRegistrationMode(form)) {
        if (existing) existing.remove();
        return;
      }

      if (existing) return;

      resetConsentState();
      const block = createConsentBlock();
      const submit = form.querySelector('.auth-submit, button[type="submit"]');
      if (submit) {
        form.insertBefore(block, submit);
      } else {
        form.appendChild(block);
      }
    });
  }

  function showConsentError(form) {
    const block = form.querySelector('.privacy-consent-wrap') || createConsentBlock();
    if (!block.parentNode) {
      const submit = form.querySelector('.auth-submit, button[type="submit"]');
      if (submit) form.insertBefore(block, submit);
      else form.appendChild(block);
    }

    const error = block.querySelector('.privacy-consent-error');
    const checkbox = block.querySelector('#personalDataConsent');
    error.classList.add('visible');
    try {
      checkbox.focus({ preventScroll: true });
    } catch (error) {
      checkbox.focus();
    }
    block.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function consentIsValid(form) {
    if (!isRegistrationMode(form)) return true;
    const checkbox = form.querySelector('#personalDataConsent');
    return Boolean(checkbox && checkbox.checked);
  }

  document.addEventListener('submit', function (event) {
    const form = event.target.closest ? event.target.closest('form.auth-form, .auth-form') : null;
    if (!form || consentIsValid(form)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showConsentError(form);
  }, true);

  document.addEventListener('click', function (event) {
    const submit = event.target.closest ? event.target.closest('.auth-form .auth-submit, .auth-form button[type="submit"]') : null;
    if (!submit) return;

    const form = submit.closest('form.auth-form, .auth-form');
    if (!form || consentIsValid(form)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showConsentError(form);
  }, true);

  function patchSupabaseSignUp() {
    if (!window.supabase || typeof window.supabase.createClient !== 'function') return;
    if (window.supabase.__privacyConsentPatched) return;

    const originalCreateClient = window.supabase.createClient;

    window.supabase.createClient = function () {
      const client = originalCreateClient.apply(this, arguments);

      if (client && client.auth && typeof client.auth.signUp === 'function' && !client.auth.__privacyConsentPatched) {
        const originalSignUp = client.auth.signUp.bind(client.auth);

        client.auth.signUp = function (credentials) {
          const consent = window.__privacyConsentState;

          if (!consent || !consent.accepted) {
            return Promise.resolve({
              data: { user: null, session: null },
              error: new Error('Необходимо принять согласие на обработку персональных данных.')
            });
          }

          const source = credentials || {};
          const options = source.options || {};
          const metadata = options.data || {};

          return originalSignUp({
            ...source,
            options: {
              ...options,
              data: {
                ...metadata,
                personal_data_consent: true,
                personal_data_consent_at: consent.acceptedAt || new Date().toISOString(),
                privacy_policy_version: POLICY_VERSION,
                privacy_policy_url: POLICY_URL,
                personal_data_consent_url: CONSENT_URL
              }
            }
          });
        };

        client.auth.__privacyConsentPatched = true;
      }

      return client;
    };

    window.supabase.__privacyConsentPatched = true;
  }

  patchSupabaseSignUp();
  addStyles();

  function startObserver() {
    syncConsentUi();
    const app = document.getElementById('app');
    if (!app) return;

    const observer = new MutationObserver(syncConsentUi);
    observer.observe(app, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
  } else {
    startObserver();
  }
})();
