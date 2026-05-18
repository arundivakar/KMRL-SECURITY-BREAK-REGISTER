async function submitBreak(action) {

    const emp_id = document.getElementById('emp_id').value;
    const break_no = document.getElementById('break_no').value;

    if (!emp_id) {
        alert('Enter Employee ID');
        return;
    }

    const response = await fetch('/api/breaks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            emp_id,
            break_no,
            action
        })
    });

    const data = await response.json();

    alert(data.message);
}
