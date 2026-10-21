(() => {
    const applyFilterAndSort = () => {
        const state = window.__gridState;
        if (!state || !window.__renderTable) return;

        const query = state.searchQuery.toLocaleLowerCase();

        let result = state.allData.filter((item) => {
            if (!query) return true;

            return ["name", "role", "department", "status"].some((key) =>
                item[key].toLocaleLowerCase().includes(query)
            );
        });

        if (state.sortKey !== null) {
            const { sortKey, sortDir } = state;
            const direction = sortDir === "asc" ? 1 : -1;

            result.sort((a, b) => {
                if (sortKey === "id") {
                    return (a.id - b.id) * direction;
                }

                return a[sortKey].localeCompare(b[sortKey]) * direction;
            });
        }

        state.filteredData = result;
        state.currentPage = 1;

        window.__renderTable();
    };

    const init = () => {
        const state = window.__gridState;
        if (!state || !window.__renderTable) return;

        document.querySelectorAll(".sort-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const key = button.dataset.sort;

                if (!key) return;

                if (key === state.sortKey) {
                    state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
                } else {
                    state.sortKey = key;
                    state.sortDir = "asc";
                }

                applyFilterAndSort();
            });
        });

        const searchInput = document.getElementById("search-input");

        if (searchInput) {
            searchInput.addEventListener("input", (event) => {
                state.searchQuery = event.target.value.trim();
                applyFilterAndSort();
            });
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
