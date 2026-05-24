async function loadExceeded() {

    const response =
        await fetch(
            '/api/today-exceeded'
        );

    const logs =
        await response.json();

    const body =
        document.getElementById(
            'logs-body'
        );

    body.innerHTML = '';

    logs.forEach(log => {

        body.innerHTML += `

        <tr style="
            background:#ffb3b3;
        ">

            <td>${
log.entry_date
?.split('-')
.reverse()
.join('/')
}</td>

            <td>${log.emp_id}</td>

            <td>${log.name || ''}</td>

            <td>${log.station}</td>

            <td>${log.shift_type}</td>

            <td>${log.shift_session}</td>

            <td>

                <b>
                    ${log.total}
                </b>

            </td>

        </tr>
        `;
    });
}

loadExceeded();
