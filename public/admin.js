let currentPage = 1;

let totalPages = 1;

async function loadLogs() {

    const response =
        await fetch(
            `/api/logs?page=${currentPage}`
        );

    const data =
        await response.json();

    const logs =
        data.rows || [];

    totalPages =
        data.totalPages || 1;

    const body =
        document.getElementById(
            'logs-body'
        );

    body.innerHTML = '';

    logs.forEach(log => {

        const total =
            Number(log.total) || 0;

        const exceeded =
            total > 40;

        body.innerHTML += `

        <tr style="
            background:
            ${exceeded
                ? '#ffb3b3'
                : 'white'}
        ">

            <td>${log.entry_date || ''}</td>

            <td>${log.emp_id || ''}</td>

            <td>${log.name || ''}</td>

            <td>${log.station || ''}</td>

            <td>${log.shift_type || ''}</td>

            <td>${log.shift_session || ''}</td>

            <td>${log.break1 || 0}</td>
            <td>${log.break2 || 0}</td>
            <td>${log.break3 || 0}</td>
            <td>${log.break4 || 0}</td>
            <td>${log.break5 || 0}</td>
            <td>${log.break6 || 0}</td>

            <td>

                <b>
                    ${total}
                </b>

            </td>

            <td>

                ${
                    exceeded
                    ? '<b style="color:red;">BREAK EXCEEDED</b>'
                    : 'NORMAL'
                }

            </td>

            <td>

                <a href="/edit/${log.id}">

                    <button>

                        ✏️

                    </button>

                </a>

            </td>

        </tr>
        `;
    });

    document.getElementById(
        'page-info'
    ).innerText =

        `Page ${currentPage} of ${totalPages}`;
}

function nextPage() {

    if (
        currentPage < totalPages
    ) {

        currentPage++;

        loadLogs();
    }
}

function prevPage() {

    if (
        currentPage > 1
    ) {

        currentPage--;

        loadLogs();
    }
}

loadLogs();
