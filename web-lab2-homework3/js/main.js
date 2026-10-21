(function () {
  'use strict';

  if (typeof window.InventoryManager !== 'function') {
    console.warn('[main] inventory.js must load before main.js');
    return;
  }

  const productList = document.getElementById('product-list');
  const inventoryStatus = document.getElementById('inventory-status');

  if (!productList || !inventoryStatus) {
    console.warn('[main] missing required DOM elements');
    return;
  }

  const cards = productList.querySelectorAll('.product-card');
  const products = Array.from(cards).map(card => ({
    id: card.dataset.id,
    stock: Number(card.dataset.stock)
  }));

  const inventory = new InventoryManager();
  inventory.init(products);

  function renderInventory() {
    for (const card of cards) {
      const item = inventory.getItem(card.dataset.id);
      if (!item) continue;

      const stockDisplay = card.querySelector('[data-stock-display]');
      const buyBtn = card.querySelector('.buy-btn');
      if (!stockDisplay || !buyBtn) continue;

      if (item.status === 'SOLD') {
        stockDisplay.textContent = 'Đã bán';
        stockDisplay.setAttribute('data-out', '');
      } else if (item.stock <= 0) {
        stockDisplay.textContent = 'Hết hàng';
        stockDisplay.setAttribute('data-out', '');
        stockDisplay.removeAttribute('data-low');
      } else if (item.stock <= 3) {
        stockDisplay.textContent = `Còn ${item.stock}`;
        stockDisplay.setAttribute('data-low', '');
        stockDisplay.removeAttribute('data-out');
      } else {
        stockDisplay.textContent = `Còn ${item.stock}`;
        stockDisplay.removeAttribute('data-low');
        stockDisplay.removeAttribute('data-out');
      }

      if (item.status === 'LOCKED') {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Đang giữ...';
      } else if (item.status === 'SOLD') {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Đã bán';
      } else if (item.stock <= 0) {
        buyBtn.disabled = true;
        buyBtn.textContent = 'Hết hàng';
      } else {
        buyBtn.disabled = false;
        buyBtn.textContent = 'Mua ngay';
      }
    }
  }

  inventory.setOnUpdate(renderInventory);
  renderInventory();

  productList.addEventListener('click', e => {
    const btn = e.target.closest('.buy-btn');
    if (!btn || btn.disabled) return;

    const id = btn.dataset.id;
    const result = inventory.lock(id);

    if (!result.ok) {
      inventoryStatus.textContent = `Không thể mua: ${result.reason}`;
    } else {
      inventoryStatus.textContent = `Đã giữ ${id}. Thanh toán trong 30s.`;
      window.setTimeout(() => inventory.confirm(id), 2000);
    }
  });

  window.addEventListener('pagehide', () => inventory.destroy());
})();