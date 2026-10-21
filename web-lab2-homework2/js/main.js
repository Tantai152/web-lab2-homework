(function () {
    'use strict';

    const requiredModules = [
        window.AudioTaskQueue,
        window.AudioEngine,
        window.Visualizer,
        window.Cleanup
    ];

    if (requiredModules.some(module => !module)) {
        console.warn('Audio Visualizer: Required modules are missing.');
        return;
    }

    const form = document.querySelector('#add-track-form');
    const urlInput = document.querySelector('#track-url');
    const addBtn = document.querySelector('#add-track-btn');
    const queueList = document.querySelector('#queue-list');
    const queueEmpty = document.querySelector('#queue-empty');
    const canvas = document.querySelector('#visualizer-canvas');
    const playBtn = document.querySelector('#play-btn');
    const pauseBtn = document.querySelector('#pause-btn');
    const stopBtn = document.querySelector('#stop-btn');
    const nowPlaying = document.querySelector('#now-playing');

    const elements = [
        form, urlInput, addBtn, queueList, queueEmpty,
        canvas, playBtn, pauseBtn, stopBtn, nowPlaying
    ];

    if (elements.some(element => !element)) {
        console.warn('Audio Visualizer: Required DOM elements are missing.');
        return;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) {
        console.warn('Audio Visualizer: Web Audio API is not supported.');
        return;
    }

    const audioContext = new AudioContextClass();
    const audioEngine = new window.AudioEngine(audioContext);
    const visualizer = new window.Visualizer(canvas, audioEngine.analyser);
    const queue = new window.AudioTaskQueue(audioContext);

    let currentlyPlayingId = null;
    let currentBuffer = null;
    let currentTrackUrl = '';

    const trackStatuses = new Map();

    function renderQueue() {
        queueList.replaceChildren();

        const tasks = queue.getQueue();

        tasks.forEach(task => {
            const status = trackStatuses.get(task.id) || 'pending';
            const item = document.createElement('li');
            item.dataset.id = task.id;
            item.dataset.status = status;

            const urlSpan = document.createElement('span');
            urlSpan.textContent = task.trackUrl;

            const statusSpan = document.createElement('span');
            statusSpan.className = 'track-status';
            statusSpan.textContent = status;

            item.append(urlSpan, statusSpan);

            if (status === 'pending' || status === 'loading') {
                const cancelBtn = document.createElement('button');
                cancelBtn.type = 'button';
                cancelBtn.textContent = 'Cancel';
                cancelBtn.dataset.action = 'cancel';
                cancelBtn.dataset.id = task.id;
                cancelBtn.setAttribute('aria-label', `Cancel track ${task.trackUrl}`);
                item.appendChild(cancelBtn);
            }

            queueList.appendChild(item);
        });

        queueEmpty.hidden = queue.pendingCount > 0;
    }

    function onStatusChange(id, status, errorMessage) {
        trackStatuses.set(id, status);

        const item = queueList.querySelector(`[data-id="${id}"]`);
        if (item) {
            item.setAttribute('data-status', status);
        }

        if (status === 'decoded') {
            queueEmpty.hidden = queue.pendingCount === 0;
        }

        if (status === 'error' && errorMessage) {
            console.warn('Audio task failed:', errorMessage);
        }

        renderQueue();
    }

    async function playTrack(buffer, trackUrl, trackId) {
        try {
            await audioEngine.resume();

            audioEngine.play(buffer, () => {
                visualizer.stop();
                playBtn.disabled = false;
                pauseBtn.disabled = true;
                stopBtn.disabled = true;
                nowPlaying.textContent = 'Nothing playing.';
                currentlyPlayingId = null;
            });

            visualizer.start();

            playBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
            nowPlaying.textContent = `Playing: ${trackUrl}`;

            currentlyPlayingId = trackId;
            currentBuffer = buffer;
            currentTrackUrl = trackUrl;
        } catch (error) {
            console.warn('Playback failed:', error);
            nowPlaying.textContent = 'Unable to play this track.';
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }
    }

    form.addEventListener('submit', event => {
        event.preventDefault();

        const url = urlInput.value.trim();
        if (!url) {
            return;
        }

        queue.enqueue(url, onStatusChange)
            .then(buffer => {
                currentBuffer = buffer;

                if (!audioEngine.isPlaying && currentlyPlayingId === null) {
                    currentTrackUrl = url;
                    const task = Array.from(trackStatuses.entries())
                        .find(([id, status]) => status === 'decoded');

                    if (task) {
                        currentlyPlayingId = task[0];
                        return playTrack(buffer, url, task[0]);
                    }
                }
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    console.warn('Decode failed', error);
                }
            });

        urlInput.value = '';
        renderQueue();
    });

    queueList.addEventListener('click', event => {
        const button = event.target.closest('button[data-action="cancel"]');

        if (!button || !queueList.contains(button)) {
            return;
        }

        queue.cancel(button.dataset.id);
        renderQueue();
    });

    playBtn.addEventListener('click', () => {
        if (currentBuffer && !audioEngine.isPlaying) {
            playTrack(currentBuffer, currentTrackUrl, currentlyPlayingId);
        } else if (!currentBuffer) {
            nowPlaying.textContent = 'Add a track first.';
        }
    });

    pauseBtn.addEventListener('click', async () => {
        try {
            if (audioContext.state === 'running') {
                await audioContext.suspend();
            } else {
                await audioContext.resume();
            }
        } catch (error) {
            console.warn('Unable to change playback state:', error);
        }
    });

    stopBtn.addEventListener('click', () => {
        audioEngine.stop();
        visualizer.stop();

        playBtn.disabled = false;
        pauseBtn.disabled = true;
        stopBtn.disabled = true;

        nowPlaying.textContent = 'Nothing playing.';
        currentlyPlayingId = null;
    });

    window.Cleanup.registerPageLifecycle(() => {
        queue.cancelAll();
        audioEngine.dispose();
        visualizer.dispose();
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderQueue, { once: true });
    } else {
        renderQueue();
    }
})();
