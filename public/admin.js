async function loadLogs() {

    const response =
        await fetch('/api/logs');

    const logs =
        await response.json();

    const body =
        document.getElementById(
            'logs-body'
        );

    body.innerHTML = '';

    logs.forEach(log => {

        const limit =
            log.shift_type === 'DOUBLE'
            ? 80
            : 40;

        const exceeded =
            log.total > limit;

        body.innerHTML += `

        <tr style="
            background:
            ${exceeded
                ? '#ffcccc'
                : 'white'}
        ">

            <td>${log.entry_date}</td>

            <td>${log.emp_id}</td>

            <td>${log.name || ''}</td>

            <td>${log.station}</td>

            <td>${log.shift_type}</td>

            <td>${log.break1}</td>
            <td>${log.break2}</td>
            <td>${log.break3}</td>
            <td>${log.break4}</td>
            <td>${log.break5}</td>
            <td>${log.break6}</td>

            <td>
                <b>
                    ${log.total}
                </b>
            </td>

            <td>

                ${
                    exceeded
                    ? 'BREAK EXCEEDED'
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
}

loadLogs();
