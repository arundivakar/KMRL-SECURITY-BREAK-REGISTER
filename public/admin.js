let currentPage = 1;

/* ===== LOAD LOGS ===== */

async function loadLogs() {

    /* ===== FILTER VALUES ===== */

    const selectedStation =

        document
        .getElementById(
            'stationFilter'
        )
        ?.value
        || '';

    const searchValue =

        document
        .getElementById(
            'searchInput'
        )
        ?.value
        || '';

    /* ===== FETCH ===== */

    const response =

        await fetch(

            `/api/logs?page=${currentPage}&station=${selectedStation}&search=${searchValue}`

        );

    const data =
        await response.json();

    /* ===== PAGE SAFETY ===== */

    if (

        currentPage > data.totalPages

        &&

        data.totalPages > 0

    ) {

        currentPage =
            data.totalPages;

        return loadLogs();
    }

    const tbody =

        document.getElementById(
            'logs-body'
        );

    tbody.innerHTML = '';

    const rows =
        data.rows || [];

    /* ===== SUMMARY ===== */

    document.getElementById(
        'totalLogs'
    ).innerText =

        data.totalLogs || 0;

    document.getElementById(
        'totalExceeded'
    ).innerText =

        data.totalExceeded || 0;

    document.getElementById(
        'runningBreaks'
    ).innerText =

        data.runningBreaks || 0;

    /* ===== TABLE ===== */

    for (const row of rows) {

        const tr =
            document.createElement('tr');

        /* ===== EXCEEDED ===== */

        if (
            Number(row.total) > 40
        ) {

            tr.classList.add(
                'break-exceeded'
            );
        }

        /* ===== RUNNING CHECK ===== */

        const isRunning =

            [
                Number(row.break1),
                Number(row.break2),
                Number(row.break3),
                Number(row.break4),
                Number(row.break5),
                Number(row.break6)
            ]

            .some(
                value => value < 0
            );

        /* ===== STATUS ===== */

        let statusHTML = '';

        if (isRunning) {

            statusHTML =

                `<span class="status-running">

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

        /* ===== ROW ===== */

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

    ${Number(row.break1) < 0 ? '⏳' : Math.max(0, row.break1 || 0)}

</td>

<td>

    ${Number(row.break2) < 0 ? '⏳' : Math.max(0, row.break2 || 0)}

</td>

<td>

    ${Number(row.break3) < 0 ? '⏳' : Math.max(0, row.break3 || 0)}

</td>

<td>

    ${Number(row.break4) < 0 ? '⏳' : Math.max(0, row.break4 || 0)}

</td>

<td>

    ${Number(row.break5) < 0 ? '⏳' : Math.max(0, row.break5 || 0)}

</td>

<td>

    ${Number(row.break6) < 0 ? '⏳' : Math.max(0, row.break6 || 0)}

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

    /* ===== PAGE INFO ===== */

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

/* ===== STATION FILTER ===== */

document

.getElementById(
    'stationFilter'
)

.addEventListener(

    'change',

    () => {

        currentPage = 1;

        loadLogs();
    }
);

/* ===== SEARCH INPUT ===== */

document

.getElementById(
    'searchInput'
)

.addEventListener(

    'keydown',

    (e) => {

        if (e.key === 'Enter') {

            currentPage = 1;

            loadLogs();
        }
    }
);

/* ===== AUTO REFRESH ===== */

setInterval(() => {

    loadLogs();

}, 30000);

/* ===== INITIAL ===== */

loadLogs();
