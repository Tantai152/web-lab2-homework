(function () {
    'use strict';

    const noop = () => {};

    function safeCancelRaf(rafId) {
        if (rafId != null) {
            try {
                cancelAnimationFrame(rafId);
            } catch (error) {
                // Ignore cancellation errors.
            }
        }
    }

    function safeAbort(controller) {
        if (controller && controller.signal && !controller.signal.aborted) {
            try {
                controller.abort();
            } catch (error) {
                // Ignore abort errors.
            }
        }
    }

    function safeDisconnect(node) {
        if (node && typeof node.disconnect === 'function') {
            try {
                node.disconnect();
            } catch (error) {
                // Ignore disconnection errors.
            }
        }
    }

    function safeCloseContext(ctx) {
        if (ctx && ctx.state !== 'closed' && typeof ctx.close === 'function') {
            try {
                const result = ctx.close();
                if (result && typeof result.catch === 'function') {
                    result.catch(noop);
                }
            } catch (error) {
                // Ignore context closing errors.
            }
        }
    }

    function registerPageLifecycle(cleanupFn) {
        if (typeof cleanupFn !== 'function') {
            return noop;
        }

        let hasCleanup = false;

        const handleLifecycle = () => {
            if (hasCleanup) {
                return;
            }

            hasCleanup = true;

            try {
                cleanupFn();
            } catch (error) {
                logCleanup('lifecycle-error', error);
            }
        };

        window.addEventListener('pagehide', handleLifecycle, {
            once: false
        });

        window.addEventListener('beforeunload', handleLifecycle, {
            once: false
        });

        return function unregister() {
            window.removeEventListener('pagehide', handleLifecycle);
            window.removeEventListener('beforeunload', handleLifecycle);
        };
    }

    function logCleanup(action, detail) {
        try {
            console.debug('[cleanup]', action, detail ?? '');
        } catch (error) {
            // Ignore logging errors.
        }
    }

    window.Cleanup = {
        safeCancelRaf,
        safeAbort,
        safeDisconnect,
        safeCloseContext,
        registerPageLifecycle,
        logCleanup
    };
})();
