(function () {
  'use strict';

  class InventoryManager {
    constructor() {
      this.items = new Map();
      this.timers = new Map();
      this.lockExpiryMs = 30000;
      this.onUpdate = null;
    }

    init(products) {
      for (const { id, stock } of products) {
        this.items.set(id, {
          id,
          stock,
          status: 'AVAILABLE',
          lockedAt: null
        });
      }
    }

    lock(id) {
      const item = this.items.get(id);
      if (!item) return { ok: false, reason: 'NOT_FOUND' };
      if (item.status !== 'AVAILABLE') return { ok: false, reason: 'NOT_AVAILABLE' };
      if (item.stock <= 0) return { ok: false, reason: 'OUT_OF_STOCK' };

      item.stock -= 1;
      item.status = 'LOCKED';
      item.lockedAt = Date.now();

      const timerId = window.setTimeout(() => this._autoRelease(id), this.lockExpiryMs);
      this.timers.set(id, timerId);

      this.onUpdate?.();
      return { ok: true, item: this.getItem(id) };
    }

    confirm(id) {
      const item = this.items.get(id);
      if (!item || item.status !== 'LOCKED') return { ok: false };

      const timerId = this.timers.get(id);
      if (timerId) {
        clearTimeout(timerId);
        this.timers.delete(id);
      }

      item.status = 'SOLD';
      item.lockedAt = null;

      this.onUpdate?.();
      return { ok: true };
    }

    release(id) {
      const item = this.items.get(id);
      if (!item || item.status !== 'LOCKED') return { ok: false };

      const timerId = this.timers.get(id);
      if (timerId) {
        clearTimeout(timerId);
        this.timers.delete(id);
      }

      item.stock += 1;
      item.status = 'AVAILABLE';
      item.lockedAt = null;

      this.onUpdate?.();
      return { ok: true };
    }

    _autoRelease(id) {
      const item = this.items.get(id);
      if (item && item.status === 'LOCKED' && (Date.now() - item.lockedAt) >= this.lockExpiryMs) {
        this.release(id);
      }
    }

    setOnUpdate(cb) {
      this.onUpdate = cb;
    }

    getItem(id) {
      const item = this.items.get(id);
      return item ? { ...item } : undefined;
    }

    getAll() {
      return Array.from(this.items.values()).map(item => ({ ...item }));
    }

    destroy() {
      for (const timerId of this.timers.values()) {
        clearTimeout(timerId);
      }
      this.timers.clear();
      this.items.clear();
    }
  }

  window.InventoryManager = InventoryManager;
})();