(() => {
    const goToPage = (newPage) => {
        const state = window.__gridState;
        if (!state || !window.__renderTable) return;

        const totalPages = Math.max(
            1,
            Math.ceil(state.filteredData.length / state.pageSize)
        );

        const targetPage = Math.min(Math.max(newPage, 1), totalPages);

        if (targetPage !== state.currentPage) {
            state.currentPage = targetPage;
            window.__renderTable();
        }
    };

    const init = () => {
        const state = window.__gridState;
        const renderTable = window.__renderTable;
        const prevButton = document.getElementById("prev-page");
        const nextButton = document.getElementById("next-page");

        if (!state || !renderTable || !prevButton || !nextButton) return;

        prevButton.addEventListener("click", () => {
            goToPage(state.currentPage - 1);
        });

        nextButton.addEventListener("click", () => {
            goToPage(state.currentPage + 1);
        });

        prevButton.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") {
                event.preventDefault();
                prevButton.click();
            }
        });

        nextButton.addEventListener("keydown", (event) => {
            if (event.key === "ArrowRight") {
                event.preventDefault();
                nextButton.click();
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
