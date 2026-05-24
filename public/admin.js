let currentPage = 1;

async function loadLogs() {

    const response =
        await fetch(
            `/api/logs?page=${currentPage}`
        );

    const data =
        await response.json();

    const tbody =
        document.getElementById(
            'logs-body'
        );

    tbody.innerHTML = '';

    const selectedStation =
        document.getElementById(
            'stationFilter'
        )?.value;

    const filteredRows =

        selectedStation

        ?

        data.rows.filter(

            row =>

            row.station ===
            selectedStation
        )

        :

        data.rows;

    for (const row of filteredRows) {

        const tr =
            document.createElement('tr');

        /* ===== ROW ALERT ===== */

        if (
            Number(row.total) > 40
        ) {

            tr.classList.add(
                'break-exceeded'
            );
        }

        /* ===== STATUS BADGE ===== */

        let statusHTML = '';

        if (row.current_open_break) {

            statusHTML =

                `<span class="status-danger">
                    BREAK RUNNING
                </span>`;
        }

        else if (
            Number(row.total) > 40
        ) {

            statusHTML =

                `<span class="status-danger">
                    BREAK EXCEEDED
                </span>`;
        }

        else {

            statusHTML =

                `<span class="status-normal">
                    NORMAL
                </span>`;
        }

        /* ===== TABLE ROW ===== */

        tr.innerHTML = `

            <td>
                ${
                    row.entry_date
                    ?.split('-')
                    .reverse()
                    .join('/')
                    || ''
                }
            </td>

            <td>
                ${row.emp_id || ''}
            </td>

            <td>
                ${row.name || ''}
            </td>

            <td>
                ${row.station || ''}
            </td>

            <td>
                ${row.shift_type || ''}
            </td>

            <td>
                ${row.shift_session || ''}
            </td>

            <td>
                ${row.break1 || 0}
            </td>

            <td>
                ${row.break2 || 0}
            </td>

            <td>
                ${row.break3 || 0}
            </td>

            <td>
                ${row.break4 || 0}
            </td>

            <td>
                ${row.break5 || 0}
            </td>

            <td>
                ${row.break6 || 0}
            </td>

            <td>
                ${row.total || 0}
            </td>

            <td>
                ${statusHTML}
            </td>

            <td>

                <a
                class="edit-icon"
                href="/edit.html?id=${row.id}">

                    &#9998;

                </a>

            </td>
        `;

        tbody.appendChild(tr);
    }

    document.getElementById(
        'page-info'
    ).innerText =

        `Page ${currentPage} of ${data.totalPages}`;
}

/* ===== NEXT PAGE ===== */

function nextPage() {

    currentPage++;

    loadLogs();
}

/* ===== PREVIOUS PAGE ===== */

function prevPage() {

    if (currentPage > 1) {

        currentPage--;

        loadLogs();
    }
}

/* ===== INITIAL LOAD ===== */

loadLogs();
