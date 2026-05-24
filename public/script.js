const empInput =
    document.getElementById(
        'emp_id'
    );

const employeeInfo =
    document.getElementById(
        'employee_info'
    );

empInput.addEventListener(
'input',

async () => {

    const empId =
        empInput.value.trim();

    if (!empId) {

        employeeInfo.innerHTML =
            '';

        return;
    }

    const response =
        await fetch(
            `/api/employee/${empId}`
        );

    const data =
        await response.json();

    if (data.found) {

        employeeInfo.innerHTML = `

            <div style="
                margin-top:10px;
                padding:10px;
                background:#d4edda;
                border-radius:5px;
            ">

                <b>
                    ${data.employee.name}
                </b>

                <br>

                ${data.employee.designation}

            </div>
        `;

    } else {

        employeeInfo.innerHTML = `

            <div style="
                margin-top:10px;
                padding:10px;
                background:#f8d7da;
                border-radius:5px;
                color:red;
            ">

                Employee Not Found

            </div>
        `;
    }
});

async function submitBreak(action) {

    const emp_id =
        document.getElementById(
            'emp_id'
        ).value.trim();

    const station =
        document.getElementById(
            'station'
        ).value;

    const shift_type =
        document.getElementById(
            'shift_type'
        ).value;

    const break_no =
        document.getElementById(
            'break_no'
        ).value;

    if (!emp_id) {

        alert(
            'Enter Employee Number'
        );

        return;
    }

    if (!station) {

        alert(
            'Select Station'
        );

        return;
    }

    const response =
        await fetch('/api/breaks', {

        method: 'POST',

        headers: {
            'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

            emp_id,

            station,

            shift_type,

            break_no,

            action
        })
    });

    const data =
        await response.json();

    const popup =
document.createElement('div');

popup.innerText =
data.message;

popup.style.position =
'fixed';

popup.style.top =
'20px';

popup.style.left =
'50%';

popup.style.transform =
'translateX(-50%)';

popup.style.background =
'#ff4444';

popup.style.color =
'white';

popup.style.padding =
'20px 40px';

popup.style.fontSize =
'28px';

popup.style.fontWeight =
'bold';

popup.style.borderRadius =
'12px';

popup.style.zIndex =
'9999';

popup.style.boxShadow =
'0 0 15px rgba(0,0,0,0.4)';

document.body.appendChild(
    popup
);

setTimeout(() => {

    popup.remove();

}, 3000);

    if (
        data.message.includes(
            'started'
        )
    ) {

        document.body.style.background =
            '#fff3cd';

    } else if (
        data.message.includes(
            'completed'
        )
    ) {

        document.body.style.background =
            '#d4edda';
    }
}
