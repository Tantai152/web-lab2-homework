(function () {
  'use strict';

  if (
    typeof window.__sanitizeFormData !== 'function' ||
    typeof window.__withSubmitGuard !== 'function'
  ) {
    console.warn('[form-state] sanitize.js must load before form-state.js');
    return;
  }

  const form = document.getElementById('register-form');
  const submitButton = document.getElementById('reg-submit');
  const status = document.getElementById('form-status');

  if (!form || !submitButton || !status) return;

  const TRANSITIONS = Object.freeze({
    idle: Object.freeze(['submitting']),
    submitting: Object.freeze(['success', 'error', 'idle']),
    success: Object.freeze(['idle']),
    error: Object.freeze(['idle', 'submitting'])
  });

  let currentState = 'idle';

  function setStatus(newState, message) {
    if (!TRANSITIONS[currentState].includes(newState)) {
      console.warn(
        `[form-state] Illegal transition: ${currentState} -> ${newState}`
      );
      return false;
    }

    currentState = newState;
    status.dataset.state = newState;
    status.textContent = message;
    submitButton.disabled = newState === 'submitting';

    return true;
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();

      status.dataset.state = 'error';
      status.textContent = 'Please fix the errors above.';
      currentState = 'idle';

      return;
    }

    const formData = new FormData(form);
    const clean = window.__sanitizeFormData(formData);

    if (!setStatus('submitting', 'Submitting…')) return;

    try {
      const result = await window.__withSubmitGuard(async () => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return { ok: true, data: clean };
      });

      if (result?.skipped) return;

      if (result?.ok) {
        setStatus(
          'success',
          `Thanks, ${clean.name}! Registration received.`
        );

        form.reset();

        setTimeout(() => {
          setStatus('idle', '');
        }, 3000);
      } else {
        setStatus('error', 'Something went wrong.');

        setTimeout(() => {
          setStatus('idle', '');
        }, 3000);
      }
    } catch (error) {
      setStatus('error', 'Something went wrong.');

      setTimeout(() => {
        setStatus('idle', '');
      }, 3000);
    }
  });
})();
