async function login() {

    const username =
        document.getElementById('username').value;

    const password =
        document.getElementById('password').value;

    const response = await fetch('/api/login', {

        method: 'POST',

        headers: {
            'Content-Type': 'application/json'
        },

        body: JSON.stringify({
            username,
            password
        })
    });

    const data = await response.json();

    if (data.success) {

        window.location.href = '/dashboard';

    } else {

        document.getElementById('message').innerText =
            data.message;
    }
}

async function loadLogs() {

    const tableBody =
        document.getElementById('logs-body');

    if (!tableBody) return;

    const response =
        await fetch('/api/logs');

    const logs =
        await response.json();

    tableBody.innerHTML = '';

    logs.forEach(log => {

        tableBody.innerHTML += `

        <tr>
            <td>${log.id}</td>
            <td>${log.emp_id}</td>
            <td>${log.break_no}</td>
            <td>${log.start_time || ''}</td>
            <td>${log.end_time || ''}</td>
            <td>${log.duration_minutes || ''}</td>
            <td>${log.status}</td>
        </tr>
        `;
    });
}

loadLogs();
