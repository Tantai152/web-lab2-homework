(function () {
    'use strict';

    class AudioTaskQueue {
        constructor(audioContext) {
            this.audioContext = audioContext;
            this.queue = [];
            this.isProcessing = false;
            this.currentTask = null;
        }

        enqueue(trackUrl, onStatusChange = () => {}) {
            return new Promise((resolve, reject) => {
                const id = typeof crypto !== 'undefined' &&
                    typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : `task-${Date.now()}-${Math.random()}`;

                const controller = new AbortController();

                const task = {
                    id,
                    trackUrl,
                    controller,
                    onStatusChange,
                    resolve,
                    reject
                };

                this.queue.push(task);
                this._processNext();
            });
        }

        async _processNext() {
            if (this.isProcessing || this.queue.length === 0) {
                return;
            }

            this.isProcessing = true;
            const task = this.queue.shift();
            this.currentTask = task;

            try {
                task.onStatusChange(task.id, 'loading');

                const response = await fetch(task.trackUrl, {
                    signal: task.controller.signal
                });

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch audio: HTTP ${response.status}`
                    );
                }

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(
                    arrayBuffer
                );

                task.onStatusChange(task.id, 'decoded');
                task.resolve(audioBuffer);
            } catch (error) {
                if (error.name === 'AbortError') {
                    task.onStatusChange(task.id, 'cancelled');
                } else {
                    task.onStatusChange(task.id, 'error', error.message);
                }

                task.reject(error);
            } finally {
                this.currentTask = null;
                this.isProcessing = false;
                this._processNext();
            }
        }

        cancel(id) {
            if (this.currentTask && this.currentTask.id === id) {
                this.currentTask.controller.abort();
                return true;
            }

            const index = this.queue.findIndex(
                task => task.id === id
            );

            if (index === -1) {
                return false;
            }

            const [task] = this.queue.splice(index, 1);

            task.controller.abort();

            const error = new DOMException(
                'Audio task cancelled.',
                'AbortError'
            );

            task.onStatusChange(task.id, 'cancelled');
            task.reject(error);

            return true;
        }

        cancelAll() {
            if (this.currentTask) {
                this.currentTask.controller.abort();
            }

            const tasks = this.queue.splice(0);

            for (const task of tasks) {
                task.controller.abort();

                const error = new DOMException(
                    'Audio task cancelled.',
                    'AbortError'
                );

                task.onStatusChange(task.id, 'cancelled');
                task.reject(error);
            }
        }

        getQueue() {
            return this.queue.slice();
        }

        get pendingCount() {
            return this.queue.length + (this.isProcessing ? 1 : 0);
        }
    }

    window.AudioTaskQueue = AudioTaskQueue;
})();
