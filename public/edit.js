const id =
    window.location.pathname
    .split('/')
    .pop();

async function loadEntry() {

    const response =
        await fetch(
            `/api/edit-entry/${id}`
        );

    const log =
        await response.json();

    const form =
        document.getElementById(
            'edit-form'
        );

    form.innerHTML = `

    <p>

        <b>Date:</b>

        ${log.entry_date}

    </p>

    <p>

        <b>Security Name:</b>

        ${log.name || ''}

    </p>

    <label>Employee ID</label>

    <input
    id="emp_id"
    value="${log.emp_id}">

    <label>Station</label>

    <input
    id="station"
    value="${log.station}">

    <label>Shift Type</label>

    <input
    id="shift_type"
    value="${log.shift_type}">

    <label>Break 1</label>

    <input
    id="break1"
    value="${log.break1}">

    <label>Break 2</label>

    <input
    id="break2"
    value="${log.break2}">

    <label>Break 3</label>

    <input
    id="break3"
    value="${log.break3}">

    <label>Break 4</label>

    <input
    id="break4"
    value="${log.break4}">

    <label>Break 5</label>

    <input
    id="break5"
    value="${log.break5}">

    <label>Break 6</label>

    <input
    id="break6"
    value="${log.break6}">

    <hr>

    <label>Edited By SC Name</label>

    <input id="edited_by_name">

    <label>Edited By SC Employee No</label>

    <input id="edited_by_emp">

    <label>Reason For Edit</label>

    <input id="edit_reason">

    <button onclick="saveEdit()">

        SAVE CHANGES

    </button>

    <hr>

    <h3>Previous Edit Details</h3>

    <p>

        Edited By:
        ${log.edited_by_name || '-'}

    </p>

    <p>

        SC Employee:
        ${log.edited_by_emp || '-'}

    </p>

    <p>

        Reason:
        ${log.edit_reason || '-'}

    </p>

    <p>

        Edited At:
        ${log.edited_at || '-'}

    </p>
    `;
}

async function saveEdit() {

    const body = {

        emp_id:
        document.getElementById(
            'emp_id'
        ).value,

        station:
        document.getElementById(
            'station'
        ).value,

        shift_type:
        document.getElementById(
            'shift_type'
        ).value,

        break1:
        document.getElementById(
            'break1'
        ).value,

        break2:
        document.getElementById(
            'break2'
        ).value,

        break3:
        document.getElementById(
            'break3'
        ).value,

        break4:
        document.getElementById(
            'break4'
        ).value,

        break5:
        document.getElementById(
            'break5'
        ).value,

        break6:
        document.getElementById(
            'break6'
        ).value,

        edited_by_name:
        document.getElementById(
            'edited_by_name'
        ).value,

        edited_by_emp:
        document.getElementById(
            'edited_by_emp'
        ).value,

        edit_reason:
        document.getElementById(
            'edit_reason'
        ).value
    };

    await fetch(

        `/api/edit-entry/${id}`,

        {

            method: 'POST',

            headers: {

                'Content-Type':
                'application/json'
            },

            body:
            JSON.stringify(body)
        });

    alert(
        'Entry Updated'
    );

    window.location.href =
        '/dashboard';
}

loadEntry();
