const express =
    require('express');

const session =
    require('express-session');

const path =
    require('path');

const app =
    express();

/* ===== BODY PARSER ===== */

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);

/* ===== TRUST PROXY ===== */

app.set(
    'trust proxy',
    1
);

/* ===== SESSION ===== */

app.use(
    session({

        secret:
            'tcs-secret',

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {
            secure: false
        }
    })
);

/* ===== STATIC ===== */

app.use(
    express.static('public')
);

/* ===== ROUTES ===== */

const authRoutes =
    require('./routes/authRoutes');

const breakRoutes =
    require('./routes/breakRoutes');

const dashboardRoutes =
    require('./routes/dashboardRoutes');

const editRoutes =
    require('./routes/editRoutes');

app.use(
    authRoutes
);

app.use(
    breakRoutes
);

app.use(
    dashboardRoutes
);

app.use(
    editRoutes
);

/* ===== SERVER ===== */

const PORT =
    process.env.PORT || 3000;

app.listen(

    PORT,

    '0.0.0.0',

    () => {

        console.log(

            `Server running on port ${PORT}`

        );
    }
);
