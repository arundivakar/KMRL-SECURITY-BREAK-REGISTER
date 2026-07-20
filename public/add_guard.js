document.getElementById('addGuardForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const emp_id = document.getElementById('guard_emp_id').value;
    const name = document.getElementById('guard_name').value;
    const designation = document.getElementById('guard_designation').value;
    const btn = document.getElementById('submitBtn');

    btn.disabled = true;
    btn.innerText = 'Adding...';

    try {
        const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ emp_id, name, designation })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('?', 'Employee added successfully!');
            document.getElementById('addGuardForm').reset();
        } else {
            showNotification('?', data.error || 'Failed to add employee', true);
        }
    } catch (err) {
        showNotification('?', 'Server connection error', true);
    } finally {
        btn.disabled = false;
        btn.innerText = 'Add to Master List';
    }
});

function showNotification(icon, text, isError = false) {
    const notif = document.getElementById('notification');
    document.getElementById('notif-icon').innerText = icon;
    document.getElementById('notif-text').innerText = text;

    if (isError) {
        notif.style.background = '#b91c1c';
    } else {
        notif.style.background = '#059669';
    }

    notif.style.opacity = '1';
    notif.style.visibility = 'visible';
    notif.style.transform = 'translateX(-50%) translateY(-20px)';

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.visibility = 'hidden';
        notif.style.transform = 'translateX(-50%) translateY(0)';
    }, 4000);
}
