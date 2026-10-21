(function () {
    'use strict';

    class AudioEngine {
        constructor(audioContext) {
            this.ctx = audioContext;
            this._analyser = this.ctx.createAnalyser();
            this._analyser.fftSize = 256;
            this.source = null;
            this.onEnded = null;
        }

        get analyser() {
            return this._analyser;
        }

        get isPlaying() {
            return this.source !== null;
        }

        play(audioBuffer, onEndedCallback) {
            if (this.source) {
                this.stop();
            }

            this.source = this.ctx.createBufferSource();
            this.source.buffer = audioBuffer;

            this.source.connect(this._analyser);
            this._analyser.connect(this.ctx.destination);

            this.onEnded = onEndedCallback;

            this.source.onended = () => {
                if (this.onEnded) {
                    this.onEnded();
                }

                this.source = null;
            };

            this.source.start(0);
        }

        stop() {
            if (this.source) {
                try {
                    this.source.stop();
                } catch (error) {
                    // Source may already be stopped.
                }

                this.source.onended = null;
                this.source.disconnect();
            }

            this._analyser.disconnect();
            this.source = null;
            this.onEnded = null;
        }

        resume() {
            if (this.ctx.state === 'suspended') {
                return this.ctx.resume();
            }

            return Promise.resolve();
        }

        dispose() {
            this.stop();
            return this.ctx.close();
        }
    }

    window.AudioEngine = AudioEngine;
})();
