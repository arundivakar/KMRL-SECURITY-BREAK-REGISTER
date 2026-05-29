const empInput =
    document.getElementById(
        'emp_id'
    );

const employeeInfo =
    document.getElementById(
        'employee_info'
    );
const startBtn =
    document.getElementById(
        'startBtn'
    );

const completeBtn =
    document.getElementById(
        'completeBtn'
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

        `/api/employee/${empId}?shift_type=${
            document.getElementById(
                'shift_type'
            ).value
        }`

    );

    const data =
        await response.json();

    if (data.found) {

        startBtn.disabled = false;

completeBtn.disabled = false;

    employeeInfo.innerHTML = `


    <div style="
        margin-top:10px;
        padding:18px;
        background:#d4edda;
        border-radius:12px;
        width:100%;
        box-sizing:border-box;
        line-height:1.8;
        font-size:18px;
    ">

        <div style="
            font-size:24px;
            font-weight:bold;
            color:#1f2937;
        ">

            ${data.employee.name}

        </div>

        <div style="
            margin-top:10px;
            font-size:17px;
            font-weight:600;
            color:#0f766e;
        ">

            ${data.status.toUpperCase()}

        </div>

        <div style="
    margin-top:15px;
    display:flex;
    justify-content:space-between;
    align-items:center;
">

    <div style="
        color:#374151;
        font-size:17px;
    ">

        Used: ${data.total} min

        <br>

        Left: ${data.balance} min

    </div>

    <div style="
        padding:10px 16px;
        border-radius:10px;
        font-weight:bold;
        font-size:15px;

        background:${
            data.balance === 0

            ? '#fecaca'

            : '#bbf7d0'
        };

        color:${
            data.balance === 0

            ? '#b91c1c'

            : '#166534'
        };
    ">

        ${
            data.balance === 0

            ? 'EXCEEDED'

            : 'NORMAL'
        }

    </div>

</div>

    </div>
`;

}
     else {

        startBtn.disabled = true;

        completeBtn.disabled = true;

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

    if (window.breakRequestRunning) {
    return;
}

window.breakRequestRunning = true;


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
        
        window.breakRequestRunning = false;

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
'12px 20px';

popup.style.fontSize =
'18px';

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
startBtn.disabled = true;

completeBtn.disabled = true;
document
.getElementById(
    'shift_type'
)

.addEventListener(

    'change',

    () => {

        empInput.dispatchEvent(
            new Event('input')
        );
    }
);