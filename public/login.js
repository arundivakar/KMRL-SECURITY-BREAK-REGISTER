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
        await fetch('/api/login', {

        method: 'POST',

        headers: {
            'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

            username,
            password
        })
    });

    const data =
        await response.json();

    if (data.success) {

        window.location.href =
            '/dashboard';

    } else {

        document.getElementById(
            'message'
        ).innerText =
            data.message;
    }
}
