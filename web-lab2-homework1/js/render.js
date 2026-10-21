(() => {
    const renderTable = () => {
        const gridBody = document.getElementById("grid-body");
        if (!gridBody) return;

        const state = window.__gridState;
        if (!state) return;

        const { filteredData, currentPage, pageSize, sortKey, sortDir } = state;
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const pageData = filteredData.slice(start, end);

        gridBody.replaceChildren();

        pageData.forEach((item) => {
            const row = document.createElement("tr");
            row.setAttribute("tabindex", "-1");
            row.className = "grid-row";
            row.dataset.id = String(item.id);

            const idCell = document.createElement("td");
            idCell.textContent = String(item.id);
            row.appendChild(idCell);

            const nameCell = document.createElement("td");
            nameCell.textContent = item.name;
            row.appendChild(nameCell);

            const roleCell = document.createElement("td");
            roleCell.textContent = item.role;
            row.appendChild(roleCell);

            const departmentCell = document.createElement("td");
            departmentCell.textContent = item.department;
            row.appendChild(departmentCell);

            const statusCell = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = `badge badge-${item.status.toLowerCase()}`;
            badge.textContent = item.status;
            statusCell.appendChild(badge);
            row.appendChild(statusCell);

            gridBody.appendChild(row);
        });

        const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
        const pageInfo = document.getElementById("page-info");
        const prevPage = document.getElementById("prev-page");
        const nextPage = document.getElementById("next-page");

        if (pageInfo) {
            pageInfo.textContent = `Page ${filteredData.length === 0 ? 1 : currentPage} of ${totalPages}`;
        }

        if (prevPage) {
            prevPage.disabled = currentPage <= 1;
        }

        if (nextPage) {
            nextPage.disabled = currentPage >= totalPages || filteredData.length === 0;
        }

        document.querySelectorAll(".sort-btn").forEach((button) => {
            const isActiveSort = button.dataset.sort === sortKey;
            button.setAttribute(
                "aria-sort",
                isActiveSort
                    ? (sortDir === "asc" ? "ascending" : "descending")
                    : "none"
            );
        });
    };

    window.__renderTable = renderTable;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderTable, { once: true });
    } else {
        renderTable();
    }
})();
