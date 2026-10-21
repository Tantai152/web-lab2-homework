# AI FAILURE MODE AUDIT — Enterprise Data Grid

## Overview

This report documents three critical AI-generated failure modes identified during the development of the Enterprise Data Grid. This audit is a mandatory deliverable for Lab 2 HW1 and provides evidence of security review, memory management analysis, and data identity validation before release.

---

## Vulnerability 01: Raw innerHTML Injection (XSS)

**AI Prompt Used:**

"Generate a function that renders table rows from an array of employee objects."

**AI Generated Code (Vulnerable):**

```javascript
function renderTable(data) {
  const tbody = document.getElementById('grid-body');
  let html = '';

  data.forEach(item => {
    html += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.role}</td></tr>`;
  });

  tbody.innerHTML = html;
}
