(function () {
  'use strict';

  const LIMITS = Object.freeze({
    name: 80,
    email: 254,
    message: 2000
  });

  // Layer 1: Remove control characters, preserving tabs and line breaks.
  function stripControlChars(str) {
    return str.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
  }

  // Layer 2: Collapse whitespace and trim leading/trailing spaces.
  function collapseWhitespace(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  // Layer 3: Clip by Unicode code points to preserve complete emoji.
  function clipByCodePoint(str, max) {
    return Array.from(str).slice(0, max).join('');
  }

  function sanitizeField(value, max) {
    return clipByCodePoint(
      collapseWhitespace(
        stripControlChars(String(value))
      ),
      max
    );
  }

  function sanitizeFormData(formData) {
    return {
      name: sanitizeField(formData.get('name') ?? '', LIMITS.name),
      email: sanitizeField(formData.get('email') ?? '', LIMITS.email),
      message: sanitizeField(formData.get('message') ?? '', LIMITS.message)
    };
  }

  let inFlight = false;

  async function withSubmitGuard(action) {
    if (inFlight) {
      return { skipped: true };
    }

    inFlight = true;

    try {
      return await action();
    } finally {
      inFlight = false;
    }
  }

  window.__sanitizeFormData = sanitizeFormData;
  window.__withSubmitGuard = withSubmitGuard;

  Object.freeze(window.__sanitizeFormData);
  Object.freeze(window.__withSubmitGuard);
})();
