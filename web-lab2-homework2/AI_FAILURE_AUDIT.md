# AI FAILURE MODE AUDIT — Concurrent Audio Visualizer

## Overview
This audit documents three critical vulnerabilities introduced by AI-generated code in the Concurrent FIFO Audio Visualizer (Lab 2 HW2). Each vulnerability was detected via DevTools profiling and fixed using engineering-grade refactors with AbortController, proper AudioNode lifecycle, and RAF cancellation.

## Vulnerability 01: AudioNode Memory Leak (No disconnect After Play)

**AI Prompt Used:**
> "Write a function that plays an AudioBuffer and stops after the duration ends."

**AI Generated Code (Defective):**
```javascript
function playBuffer(ctx, buffer) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start(0);
  source.onended = () => {
    // Missing disconnect → node retains reference to buffer
    // ctx.destination retains reference to source
  };
}
```
Each play creates a new BufferSourceNode. Without `disconnect()`, the node and its AudioBuffer remain reachable from the destination, preventing garbage collection. Node count grows linearly with plays; AudioContext hardware limits are eventually exceeded.

**Risk:** Memory leak (CWE-401). After dozens of plays, JS heap and GPU memory climb until the tab crashes.

**Detection Method:**
1. Open DevTools → Performance Monitor → track JS heap + GPU memory.
2. Play 50 tracks sequentially.
3. Heap fails to return to baseline → leak confirmed.
4. Cross-check `chrome://media-internals` → AudioContext node count never drops to zero.

**Engineering Refactor:**
```javascript
function playBuffer(ctx, analyser, buffer, onEnded) {
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(analyser);
  analyser.connect(ctx.destination);
  source.onended = () => {
    source.disconnect();
    analyser.disconnect();
    onEnded?.();
  };
  source.start(0);
  return source;
}
```

**Verification:** 50 consecutive plays; heap stabilizes. `chrome://media-internals` shows node count returning to 0 after each track.

---

## Vulnerability 02: RAF Loop Not Cancelled on Unmount (Layout Thrashing)

**AI Prompt Used:**
> "Create a canvas audio visualizer that updates 60fps using requestAnimationFrame."

**AI Generated Code (Defective):**
```javascript
function startVisualizer(canvas, analyser) {
  const ctx = canvas.getContext('2d');
  const data = new Uint8Array(analyser.frequencyBinCount);
  function draw() {
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // ... draw bars ...
    requestAnimationFrame(draw);  // ID not stored
  }
  requestAnimationFrame(draw);
}
// No stop function → RAF runs forever even after audio stops
```
No `cancelAnimationFrame` call; the closure captures `draw` indefinitely. Canvas repaints at 60 fps regardless of audio state.

**Risk:** Resource exhaustion (CWE-400). CPU stays at 100%, battery drains. User clicks "Stop" but visualizer keeps drawing → broken UX.

**Detection Method:**
1. Record 10 s in DevTools → Performance after stopping audio.
2. RAF callbacks still firing → confirmed.
3. Enable Rendering → Paint Flashing: canvas repaints despite stopped audio.

**Engineering Refactor:**
```javascript
class Visualizer {
  constructor(canvas, analyser) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyser;
    this.data = new Uint8Array(analyser.frequencyBinCount);
    this.rafId = null;
    this.running = false;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this._draw();
  }
  _draw() {
    if (!this.running) return;
    this.analyser.getByteFrequencyData(this.data);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // ... draw bars ...
    this.rafId = requestAnimationFrame(() => this._draw());
  }
  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
```

**Verification:** After `stop()`, Performance recording shows zero RAF callbacks. CPU drops to 0%.

---

## Vulnerability 03: Race Condition in FIFO Queue (Double Play / No Abort)

**AI Prompt Used:**
> "Implement a queue that downloads audio files and plays them sequentially."

**AI Generated Code (Defective):**
```javascript
async function processQueue(queue) {
  for (const task of queue) {
    const response = await fetch(task.url);  // No AbortController
    const buffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(buffer);
    playBuffer(ctx, audioBuffer);  // Fire-and-forget, no await
  }
}
// Rapid enqueue of 2 tracks → both decode and play near-simultaneously
```
No `AbortController` → downloads cannot be cancelled. No mutual exclusion → concurrent `playBuffer` calls cause overlapping audio.

**Risk:** Race condition + missing cancellation (CWE-362). Two tracks play simultaneously; user cannot cancel in-flight fetch.

**Detection Method:**
1. Enqueue two URLs within 1 s → hear overlapping playback.
2. Network tab: two concurrent fetches instead of sequential.
3. Console logs show `playBuffer` count > 1 at same timestamp.

**Engineering Refactor:**
```javascript
class AudioTaskQueue {
  constructor(ctx) {
    this.ctx = ctx;
    this.queue = [];
    this.isProcessing = false;
  }
  async enqueue(url, onStatus) {
    const controller = new AbortController();
    const id = crypto.randomUUID();
    this.queue.push({ id, url, controller, onStatus });
    return this._processNext();
  }
  async _processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;
    const task = this.queue.shift();
    try {
      const res = await fetch(task.url, { signal: task.controller.signal });
      const buf = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(buf);
      task.onStatus(task.id, 'decoded');
      return audioBuffer;
    } catch (e) {
      task.onStatus(task.id, e.name === 'AbortError' ? 'cancelled' : 'error');
      throw e;
    } finally {
      this.isProcessing = false;
      this._processNext();
    }
  }
  cancelAll() {
    this.queue.forEach(t => t.controller.abort());
    this.queue = [];
  }
}
```

**Verification:** Rapid double enqueue → Network tab shows strictly sequential fetches. Only one track plays at a time. Cancel button triggers `AbortError` caught cleanly.

---

## Summary Table

| #  | Vulnerability                         | CWE      | Severity | Fixed |
|----|---------------------------------------|----------|----------|-------|
| 01 | AudioNode Memory Leak                 | CWE-401  | High     | Yes   |
| 02 | RAF Loop Resource Exhaustion          | CWE-400  | High     | Yes   |
| 03 | FIFO Race Condition + No Abort        | CWE-362  | Critical | Yes   |

## Engineering Verification Workflow
Per Lab 2 slide 2: **Functional Slice → Type Contract → Atomic Gen → DevTools Audit**. This file is evidence of step 4.
