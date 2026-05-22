async function loadHabitual() {

    const response =
        await fetch(
            '/api/habitual-offenders'
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
            background:#ffcccc;
        ">

            <td>${log.emp_id}</td>

            <td>${log.name || ''}</td>

            <td>

                <b>
                    ${log.exceed_count}
                </b>

            </td>

            <td>${log.latest_date}</td>

            <td>${log.latest_station}</td>

        </tr>
        `;
    });
}

loadHabitual();
