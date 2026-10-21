# AI FAILURE MODE AUDIT — Flash Sale Engine

## Overview
Mandatory deliverable for Lab 2 HW3: demonstrate 3 critical failure modes from AI-generated code and their engineering refactors (drift-free timer, optimistic lock FSM, sanitization pipeline).

---

## Vulnerability 01: Countdown Drift with setInterval

**AI Prompt Used:**
"Create a countdown timer that decrements every second for a flash sale."

**AI Generated Code (Buggy):**
```javascript
let remaining = 3600;
setInterval(() => {
  remaining--;
  display.textContent = format(remaining);
}, 1000);
```

**Risk:** Timer drift, CWE-367. `setInterval` drifts against real time. Background tabs get throttled → large deviation (30-60s after 1 hour). Flash sale ends at wrong time, users can purchase after sale ends.

**Detection Method:**
- Open countdown for 5 minutes, compare with system clock.
- Switch tab to background for 1 minute, return → display shows large deviation.

**Engineering Refactor:**
```javascript
const targetMs = Date.parse(targetEl.dataset.target);
function tick() {
  const remaining = targetMs - Date.now();
  if (remaining <= 0) { display.textContent = '00:00:00'; return; }
  // format HH:MM:SS...
  const delay = 1000 - (Date.now() % 1000);
  timerId = setTimeout(tick, delay);
}
tick();
```

**Verification:** Background tab for 5 minutes, return → display matches wall clock.

---

## Vulnerability 02: Inventory Race Condition (Double-Sell)

**AI Prompt Used:**
"Implement a buy button that decrements stock when clicked."

**AI Generated Code (Buggy):**
```javascript
let stock = 10;
buyBtn.addEventListener('click', () => {
  if (stock > 0) {
    stock--;
    updateUI(stock);
  }
});
```

**Risk:** Race condition + inventory oversell, CWE-362 + CWE-840. Two tabs clicking simultaneously → oversell. No temporary lock → stock decrements even if user doesn't complete payment → "phantom inventory". Violates e-commerce regulations.

**Detection Method:**
- Open 2 tabs, click buy simultaneously.
- Check for negative stock or total orders > initial stock.
- DevTools Network: 2 concurrent requests.

**Engineering Refactor:**
```javascript
const item = this.items.get(id);
if (item.status !== 'AVAILABLE' || item.stock <= 0) return { ok: false };
item.stock--;
item.status = 'LOCKED';
item.lockedAt = Date.now();
setTimeout(() => this._autoRelease(id), 30000);
return { ok: true };

confirm(id) {
  if (item.status !== 'LOCKED') return { ok: false };
  item.status = 'SOLD';
  clearTimeout(this.timers.get(id));
  return { ok: true };
}
```

**Verification:** 2 tabs click simultaneously → 1 succeeds, 1 receives LOCKED. After 30s without payment → stock auto-releases.

---

## Vulnerability 03: Unbounded Form Input (XSS + DoS)

**AI Prompt Used:**
"Save the form submission and display a thank you message with the user's name."

**AI Generated Code (Buggy):**
```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.name.value;
  status.innerHTML = `Thanks, ${name}!`;
});
```

**Risk:** Stored XSS + DoS, CWE-79 + CWE-400. `innerHTML` → XSS if name contains `<img onerror>`. No length limit → 10MB text in name field → DOM render freezes browser.

**Detection Method:**
- Paste `<img src=x onerror=alert(1)>` into name field, submit → alert fires.
- Paste 1MB text → form submit slows, browser may freeze.

**Engineering Refactor:**
```javascript
const clean = window.__sanitizeFormData(new FormData(form));
status.textContent = `Thanks, ${clean.name}!`;

// In sanitize.js:
const clipByCodePoint = (str, max) => Array.from(str).slice(0, max).join('');
const LIMITS = { name: 80, email: 254, message: 2000 };
```

**Verification:** Name contains `<script>` → textContent displays literal. 1MB input → clipped to 80 chars.

---

## Summary Table

| # | Vulnerability | CWE | Severity | Fixed |
|---|---------------|-----|----------|-------|
| 01 | Countdown Drift (setInterval) | CWE-367 | Medium | Yes |
| 02 | Inventory Race Condition | CWE-362/CWE-840 | Critical | Yes |
| 03 | Unbounded Form Input (XSS+DoS) | CWE-79/CWE-400 | High | Yes |

---

## Engineering Verification Workflow
Per Lab 2 slide page 2: Functional Slice → Type Contract → Atomic Gen → DevTools Audit.