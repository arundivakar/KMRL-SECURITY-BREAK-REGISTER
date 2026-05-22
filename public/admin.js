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

    for (const row of data.rows) {

        const tr =
            document.createElement('tr');
if (
    Number(row.total) > 40
) {

    tr.style.background =
        '#ffcccc';
}

        tr.innerHTML = `

            <td>${row.entry_date || ''}</td>

            <td>${row.emp_id || ''}</td>

            <td>${row.name || ''}</td>

            <td>${row.station || ''}</td>

            <td>${row.shift_type || ''}</td>

            <td>${row.shift_session || ''}</td>

            <td>${row.break1 || 0}</td>

            <td>${row.break2 || 0}</td>

            <td>${row.break3 || 0}</td>

            <td>${row.break4 || 0}</td>

            <td>${row.break5 || 0}</td>

            <td>${row.break6 || 0}</td>

            <td>${row.total || 0}</td>

            <td>

                ${row.current_open_break

    ? 'BREAK RUNNING'

    : Number(row.total) > 40

        ? 'BREAK EXCEEDED'

        : 'NORMAL'}

            </td>

            <td>

                <a href="/edit.html?id=${row.id}">
                    Edit
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

function nextPage() {

    currentPage++;

    loadLogs();
}

function prevPage() {

    if (currentPage > 1) {

        currentPage--;

        loadLogs();
    }
}

loadLogs();
