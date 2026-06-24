let dashboardFilter = '';
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

`/api/logs?page=${currentPage}&station=${selectedStation}&search=${searchValue}&filter=${dashboardFilter}`

);

    const data =
        await response.json();

    /* ===== RENDER WARNINGS ===== */
    const warningsContainer = document.getElementById('scWarningsContainer');
    if (warningsContainer) {
        if (data.scWarnings && data.scWarnings.length > 0) {
            warningsContainer.innerHTML = data.scWarnings.map(msg => 
                `<div style="background:#fef2f2; border:1px solid #f87171; color:#b91c1c; padding:12px 16px; border-radius:8px; margin-bottom:15px; font-weight:600; text-align:center;">
                    ${msg}
                </div>`
            ).join('');
        } else {
            warningsContainer.innerHTML = '';
        }
    }

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
    Boolean(row.current_open_break);

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

        /* ===== TOOLTIP HELPER ===== */
        const getTooltip = (logs, breakKey) => {
            if (!logs || (!logs[`${breakKey}_start`] && !logs[`${breakKey}_end`])) return '';
            return `title="Start: ${logs[`${breakKey}_start`] || 'N/A'} | End: ${logs[`${breakKey}_end`] || 'N/A'}"`;
        };

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

    ${row.shift_session || ''}

</td>

      <td ${getTooltip(row.break_logs, 'break1')}>
    ${row.current_open_break === 'Break 1'
        ? '⏳'
        : Math.max(0, row.break1 || 0)}
</td>

<td ${getTooltip(row.break_logs, 'break2')}>
    ${row.current_open_break === 'Break 2'
        ? '⏳'
        : Math.max(0, row.break2 || 0)}
</td>

<td ${getTooltip(row.break_logs, 'break3')}>
    ${row.current_open_break === 'Break 3'
        ? '⏳'
        : Math.max(0, row.break3 || 0)}
</td>

<td ${getTooltip(row.break_logs, 'break4')}>
    ${row.current_open_break === 'Break 4'
        ? '⏳'
        : Math.max(0, row.break4 || 0)}
</td>

<td ${getTooltip(row.break_logs, 'break5')}>
    ${row.current_open_break === 'Break 5'
        ? '⏳'
        : Math.max(0, row.break5 || 0)}
</td>

<td ${getTooltip(row.break_logs, 'break6')}>
    ${row.current_open_break === 'Break 6'
        ? '⏳'
        : Math.max(0, row.break6 || 0)}
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
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

function shouldRefresh() {
    const hour = new Date().getHours();

    // Disable auto refresh from 10 PM to 7 AM
    if (hour >= 22 || hour < 7) {
        return false;
    }

    return document.visibilityState === 'visible';
}

setInterval(() => {
    if (shouldRefresh()) {
        loadLogs();
    }
}, 480000); // 8 minutes
/* ===== INITIAL ===== */

loadLogs();
document
.getElementById('totalExceeded')
.addEventListener(

    'click',

    () => {

        dashboardFilter =
            'exceeded';

        currentPage = 1;

        loadLogs();
    }
);

document
.getElementById('runningBreaks')
.addEventListener(

    'click',

    () => {

        dashboardFilter =
            'running';

        currentPage = 1;

        loadLogs();
    }
);
document
.getElementById('totalLogs')
.addEventListener(

    'click',

    () => {

        dashboardFilter = '';

        currentPage = 1;

        loadLogs();
    }
);