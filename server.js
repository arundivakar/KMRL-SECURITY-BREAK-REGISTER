const express =
    require('express');

const session =
    require('express-session');

const path =
    require('path');

const app = express();

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

app.use(session({

    secret: 'kmrl-secret',

    resave: false,

    saveUninitialized: false
}));

app.use(express.static('public'));

const authRoutes =
    require('./routes/authRoutes');

const breakRoutes =
    require('./routes/breakRoutes');

const dashboardRoutes =
    require('./routes/dashboardRoutes');

const editRoutes =
    require('./routes/editRoutes');

app.use(authRoutes);

app.use(breakRoutes);

app.use(dashboardRoutes);

app.use(editRoutes);

app.listen(3000, () => {

    console.log(
        'Server running on port 3000'
    );
});
