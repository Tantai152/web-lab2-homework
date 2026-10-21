(() => {
    const getRows = () => {
        const gridBody = document.getElementById("grid-body");
        if (!gridBody) return [];

        return Array.from(gridBody.querySelectorAll("tr.grid-row"));
    };

    const focusRow = (index) => {
        const rows = getRows();
        if (rows.length === 0) return;

        const clampedIndex = Math.max(0, Math.min(index, rows.length - 1));

        rows.forEach((row, i) => {
            row.setAttribute("tabindex", i === clampedIndex ? "0" : "-1");
        });

        rows[clampedIndex].focus();
    };

    const init = () => {
        const gridBody = document.getElementById("grid-body");
        if (!gridBody) return;

        gridBody.addEventListener("keydown", (event) => {
            const rows = getRows();
            if (rows.length === 0) return;

            const currentIndex = rows.indexOf(document.activeElement);
            if (currentIndex === -1) return;

            switch (event.key) {
                case "ArrowDown":
                    event.preventDefault();
                    focusRow(currentIndex + 1);
                    break;

                case "ArrowUp":
                    event.preventDefault();
                    focusRow(currentIndex - 1);
                    break;

                case "Home":
                    event.preventDefault();
                    focusRow(0);
                    break;

                case "End":
                    event.preventDefault();
                    focusRow(rows.length - 1);
                    break;

                case "Enter":
                case " ":
                    event.preventDefault();
                    rows[currentIndex].classList.toggle("selected-row");
                    break;

                default:
                    break;
            }
        });
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
