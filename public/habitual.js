let currentPage = 1;

const limit = 50;

async function loadHabitual() {

    const response =
        await fetch(
            `/api/habitual-offenders?page=${currentPage}`
        );

    const logs =
        await response.json();

    const body =
        document.getElementById(
            'logs-body'
        );

    body.innerHTML = '';

    const searchValue =

        document.getElementById(
            'searchInput'
        )

        .value

        .trim()

        .toUpperCase();

    const filtered =

        searchValue

        ?

        logs.rows.filter(log =>

            String(log.emp_id)
            .includes(searchValue)
        )

        :

        logs.rows;

    filtered.forEach(log => {

        body.innerHTML += `

        <tr style="
            background:#ffcccc;
        ">

            <td>${log.emp_id}</td>

            <td>${log.name || ''}</td>

            <td>

                <b>
                    ${log.total_violations || 0}
                </b>

            </td>

            <td>

                ${
                    log.latest_date

                    ?

                    log.latest_date
                    .split('-')
                    .reverse()
                    .join('/')

                    :

                    ''
                }

            </td>

            <td>${log.latest_station || ''}</td>

        </tr>
        `;
    });

    document.getElementById(
        'page-info'
    ).innerText =

        `Page ${currentPage} of ${logs.totalPages}`;
}

function nextPage() {

    const totalPages =

        Number(

            document
            .getElementById(
                'page-info'
            )
            .innerText
            .split('of')[1]
        );

    if (currentPage < totalPages) {

        currentPage++;

        loadHabitual();
    }
}

function prevPage() {

    if (currentPage > 1) {

        currentPage--;

        loadHabitual();
    }
}

loadHabitual();
