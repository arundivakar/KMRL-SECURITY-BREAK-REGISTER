const params =

    new URLSearchParams(
        window.location.search
    );

const id =
    params.get('id');

/* ===== LOAD ENTRY ===== */

async function loadEntry() {

    try {

        const response =
            await fetch(
                `/api/edit-entry/${id}`
            );

        const data =
            await response.json();

        console.log(data);

        /* ===== SUMMARY ===== */

        document.getElementById(
            'date'
        ).innerText =
            data.entry_date || '';

        document.getElementById(
            'security-name'
        ).innerText =
            data.name || '';

        /* ===== EMPLOYEE ===== */

        document.getElementById(
            'emp_id'
        ).value =
            data.emp_id || '';

        document.getElementById(
            'station'
        ).value =
            data.station || '';

        document.getElementById(
            'shift_type'
        ).value =
            data.shift_type || 'NORMAL';

        /* ===== BREAKS ===== */

        document.getElementById(
            'break1'
        ).value =
            data.break1 ?? 0;

        document.getElementById(
            'break2'
        ).value =
            data.break2 ?? 0;

        document.getElementById(
            'break3'
        ).value =
            data.break3 ?? 0;

        document.getElementById(
            'break4'
        ).value =
            data.break4 ?? 0;

        document.getElementById(
            'break5'
        ).value =
            data.break5 ?? 0;

        document.getElementById(
            'break6'
        ).value =
            data.break6 ?? 0;

    } catch (err) {

        console.log(
            'LOAD ERROR:',
            err
        );

        alert(
            'Failed to load entry'
        );
    }
}

/* ===== SAVE ===== */

async function saveEdit() {

    try {

        const response =
            await fetch(
                `/api/edit-entry/${id}`,
                {

                    method: 'POST',

                    headers: {
                        'Content-Type':
                        'application/json'
                    },

                    body: JSON.stringify({

                        emp_id:
                            document
                            .getElementById(
                                'emp_id'
                            ).value,

                        station:
                            document
                            .getElementById(
                                'station'
                            ).value,

                        shift_type:
                            document
                            .getElementById(
                                'shift_type'
                            ).value,

                        break1:
                            Number(
                                document
                                .getElementById(
                                    'break1'
                                ).value
                            ) || 0,

                        break2:
                            Number(
                                document
                                .getElementById(
                                    'break2'
                                ).value
                            ) || 0,

                        break3:
                            Number(
                                document
                                .getElementById(
                                    'break3'
                                ).value
                            ) || 0,

                        break4:
                            Number(
                                document
                                .getElementById(
                                    'break4'
                                ).value
                            ) || 0,

                        break5:
                            Number(
                                document
                                .getElementById(
                                    'break5'
                                ).value
                            ) || 0,

                        break6:
                            Number(
                                document
                                .getElementById(
                                    'break6'
                                ).value
                            ) || 0,

                        edited_by_name:
                            document
                            .getElementById(
                                'edited_by_name'
                            ).value,

                        edited_by_emp:
                            document
                            .getElementById(
                                'edited_by_emp'
                            ).value,

                        edit_reason:
                            document
                            .getElementById(
                                'edit_reason'
                            ).value
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {

            alert(
                'Updated Successfully'
            );

            window.location.href =
                '/dashboard';

        } else {

            alert(
                'Update Failed'
            );
        }

    } catch (err) {

        console.log(
            'SAVE ERROR:',
            err
        );

        alert(
            'Server Error'
        );
    }
}

/* ===== INITIAL LOAD ===== */

loadEntry();
