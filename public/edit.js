const params =
    new URLSearchParams(
        window.location.search
    );

const id =
    params.get('id');

let currentEntry = null;

/* ===== ERROR HANDLING ===== */

function showError(msg) {
    const alertEl = document.getElementById('error-alert');
    if (alertEl) {
        alertEl.innerText = msg;
        alertEl.style.display = 'block';
        alertEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        alert(msg);
    }
}

function hideError() {
    const alertEl = document.getElementById('error-alert');
    if (alertEl) {
        alertEl.style.display = 'none';
        alertEl.innerText = '';
    }
}

/* ===== LOAD ENTRY ===== */

async function loadEntry() {
    try {
        const response =
            await fetch(
                `/api/edit-entry/${id}`
            );

        if (!response.ok) {
            showError('Failed to load entry details. Record may not exist.');
            return;
        }

        const data =
            await response.json();

        currentEntry = data;

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

        if (data.name) {
            const statusEl = document.getElementById('emp_status');
            if (statusEl) {
                statusEl.innerText = '✓ ' + data.name;
                statusEl.style.color = '#16a34a';
            }
        }

        document.getElementById(
            'station'
        ).value =
            data.station || '';

        document.getElementById(
            'shift_type'
        ).value =
            data.shift_type || 'NORMAL';

        /* ===== BREAKS ===== */
        const breaks = [
            data.break1 ?? 0,
            data.break2 ?? 0,
            data.break3 ?? 0,
            data.break4 ?? 0,
            data.break5 ?? 0,
            data.break6 ?? 0
        ];

        let hasRunning = false;
        breaks.forEach((bVal, idx) => {
            const el = document.getElementById(`break${idx + 1}`);
            if (el) el.value = bVal;
            if (bVal === -1) hasRunning = true;
        });

        const noticeEl = document.getElementById('running-break-notice');
        if (noticeEl) {
            if (hasRunning) {
                noticeEl.innerText = `ℹ ${data.current_open_break || 'A break'} is currently running (value: -1). Leave as -1 to keep running, or enter positive minutes to finalize.`;
                noticeEl.style.display = 'block';
            } else {
                noticeEl.style.display = 'none';
            }
        }

    } catch (err) {
        console.error('LOAD ERROR:', err);
        showError('Network error: Failed to load entry details.');
    }
}

/* ===== DYNAMIC EMPLOYEE LOOKUP ===== */

let empLookupTimer;
const empInput = document.getElementById('emp_id');
if (empInput) {
    empInput.addEventListener('input', () => {
        clearTimeout(empLookupTimer);
        const val = empInput.value.trim();
        const statusEl = document.getElementById('emp_status');
        const nameEl = document.getElementById('security-name');

        if (!val || val === '0') {
            if (statusEl) {
                statusEl.innerText = val === '0' ? '✗ Employee ID cannot be 0' : '';
                statusEl.style.color = '#dc2626';
            }
            if (nameEl) nameEl.innerText = '';
            return;
        }

        empLookupTimer = setTimeout(async () => {
            try {
                const res = await fetch(`/api/employee/${encodeURIComponent(val)}`);
                const empData = await res.json();
                if (empData.found && empData.employee) {
                    if (nameEl) nameEl.innerText = empData.employee.name;
                    if (statusEl) {
                        statusEl.innerText = '✓ ' + empData.employee.name;
                        statusEl.style.color = '#16a34a';
                    }
                    hideError();
                } else {
                    if (nameEl) nameEl.innerText = 'Not Found';
                    if (statusEl) {
                        statusEl.innerText = '✗ Employee not found in active roster';
                        statusEl.style.color = '#dc2626';
                    }
                }
            } catch (e) {
                console.error('Lookup error:', e);
            }
        }, 400);
    });
}

/* ===== SAVE EDIT ===== */

async function saveEdit() {
    hideError();

    const emp_id = document.getElementById('emp_id').value.trim();
    const station = document.getElementById('station').value;
    const shift_type = document.getElementById('shift_type').value;

    /* ===== CLIENT-SIDE VALIDATION ===== */

    if (!emp_id || emp_id === '0' || emp_id.toLowerCase() === 'null') {
        showError('Please enter a valid Employee ID (cannot be 0 or empty).');
        document.getElementById('emp_id').focus();
        return;
    }

    if (!station) {
        showError('Please select an official KMRL station from the dropdown.');
        document.getElementById('station').focus();
        return;
    }

    const breakValues = {};
    for (let i = 1; i <= 6; i++) {
        const raw = document.getElementById(`break${i}`).value.trim();
        const num = Number(raw === '' ? 0 : raw);

        if (isNaN(num) || !Number.isInteger(num)) {
            showError(`Break ${i} must be a valid whole number.`);
            document.getElementById(`break${i}`).focus();
            return;
        }

        if (num < 0) {
            // Allow -1 only if this break was already -1 in the existing entry
            const orig = currentEntry ? Number(currentEntry[`break${i}`]) : 0;
            if (num === -1 && orig === -1) {
                breakValues[`break${i}`] = -1;
            } else {
                showError(`Break ${i} cannot be negative. Enter 0 or duration in minutes.`);
                document.getElementById(`break${i}`).focus();
                return;
            }
        } else {
            breakValues[`break${i}`] = num;
        }
    }

    const edited_by_name = document.getElementById('edited_by_name').value.trim();
    if (!edited_by_name) {
        showError('Please enter "Edited By Name" for audit traceability.');
        document.getElementById('edited_by_name').focus();
        return;
    }

    const edited_by_emp = document.getElementById('edited_by_emp').value.trim();
    if (!edited_by_emp) {
        showError('Please enter "Edited By Employee ID" for audit traceability.');
        document.getElementById('edited_by_emp').focus();
        return;
    }

    const edit_reason = document.getElementById('edit_reason').value.trim();
    if (!edit_reason) {
        showError('Please provide an "Edit Reason" explaining the modification.');
        document.getElementById('edit_reason').focus();
        return;
    }

    try {
        const response =
            await fetch(
                `/api/edit-entry/${id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        emp_id,
                        station,
                        shift_type,
                        ...breakValues,
                        edited_by_name,
                        edited_by_emp,
                        edit_reason
                    })
                }
            );

        const data =
            await response.json();

        if (data.success) {
            alert('Break entry updated successfully.');
            window.location.href = '/dashboard';
        } else {
            showError(data.message || 'Update failed. Please review your inputs.');
        }

    } catch (err) {
        console.error('SAVE ERROR:', err);
        showError('Network/Server error: Could not complete the update.');
    }
}

/* ===== INITIAL LOAD ===== */

loadEntry();

