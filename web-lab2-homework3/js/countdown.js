(function () {
  const targetEl = document.getElementById('countdown-target');
  const displayEl = document.getElementById('cd-display');
  const statusEl = document.getElementById('cd-status');

  if (!targetEl || !displayEl || !statusEl) return;

  const targetMs = Date.parse(targetEl.dataset.target);
  const valid = Number.isFinite(targetMs);

  if (!valid) {
    displayEl.textContent = '--:--:--';
    statusEl.textContent = 'Invalid target';
    return;
  }

  let timerId = null;

  function tick() {
    const remaining = targetMs - Date.now();

    if (remaining <= 0) {
      displayEl.textContent = '00:00:00';
      statusEl.textContent = 'Đã kết thúc.';
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      return;
    }

    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    displayEl.textContent =
      String(hours).padStart(2, '0') + ':' +
      String(minutes).padStart(2, '0') + ':' +
      String(seconds).padStart(2, '0');

    statusEl.textContent = 'Đang đếm ngược...';

    // Recursive setTimeout aligned to next second avoids drift.
    // setInterval accumulates error because callback execution time varies.
    const delay = 1000 - (Date.now() % 1000);
    timerId = window.setTimeout(tick, delay);
  }

  window.addEventListener('pagehide', () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  });

  tick();
})();