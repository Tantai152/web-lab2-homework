(function () {
    'use strict';

    class Visualizer {
        constructor(canvas, analyser) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.analyser = analyser;
            this.dataArray = new Uint8Array(analyser.frequencyBinCount);
            this.rafId = null;
            this.running = false;
        }

        start() {
            if (this.running) {
                return;
            }

            this.running = true;
            this._draw();
        }

        _draw() {
            if (!this.running) {
                return;
            }

            const w = this.canvas.width;
            const h = this.canvas.height;

            if (w === 0 || h === 0) {
                this.rafId = requestAnimationFrame(() => this._draw());
                return;
            }

            const styles = getComputedStyle(document.documentElement);
            const getColor = (property, fallback) =>
                styles.getPropertyValue(property).trim() || fallback;

            const canvasBg = getColor('--canvas-bg', '#020617');
            const gradientStart = getColor('--bar-gradient-start', '#06b6d4');
            const gradientEnd = getColor('--bar-gradient-end', '#a855f7');

            this.analyser.getByteFrequencyData(this.dataArray);

            this.ctx.fillStyle = canvasBg;
            this.ctx.fillRect(0, 0, w, h);

            const barCount = Math.ceil(this.dataArray.length / 2);
            const barWidth = w / barCount;
            const gradient = this.ctx.createLinearGradient(0, h, 0, 0);

            gradient.addColorStop(0, gradientStart);
            gradient.addColorStop(1, gradientEnd);

            this.ctx.fillStyle = gradient;

            for (let i = 0; i < barCount; i++) {
                const value = this.dataArray[i];
                const barHeight = (value / 255) * h;
                const x = i * barWidth;

                this.ctx.fillRect(
                    x,
                    h - barHeight,
                    Math.max(0, barWidth - 1),
                    barHeight
                );
            }

            this.rafId = requestAnimationFrame(() => this._draw());
        }

        stop() {
            this.running = false;

            if (this.rafId !== null) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }

            const w = this.canvas.width;
            const h = this.canvas.height;

            if (w > 0 && h > 0) {
                this.ctx.clearRect(0, 0, w, h);
            }
        }

        dispose() {
            this.stop();
        }
    }

    window.Visualizer = Visualizer;
})();
