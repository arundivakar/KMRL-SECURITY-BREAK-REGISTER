async function login() {

    const username =
        document.getElementById(
            'username'
        ).value;

    const password =
        document.getElementById(
            'password'
        ).value;

    const response =
        await fetch(
            '/api/login',
            {

                method: 'POST',

                headers: {
                    'Content-Type':
                    'application/json'
                },

                body: JSON.stringify({

                    username,

                    password
                })
            }
        );

    const data =
        await response.json();

    if (data.success) {

        window.location =
            '/dashboard';

    } else {

        alert(
            data.message
        );
    }
}

document.addEventListener(
'keydown',

function(event) {

    if (
        event.key === 'Enter'
    ) {

        login();
    }
});
