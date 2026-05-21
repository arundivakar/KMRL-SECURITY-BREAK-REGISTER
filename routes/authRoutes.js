const express =
    require('express');

const bcrypt =
    require('bcrypt');

const path =
    require('path');

const db =
    require('../db/database');

const router =
    express.Router();

function isAuthenticated(
    req,
    res,
    next
) {

    if (
        req.session.loggedIn
    ) {

        return next();
    }

    res.redirect(
        '/login.html'
    );
}

router.get(
'/dashboard',

isAuthenticated,

(req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/dashboard.html'
        )
    );
});

router.get(
'/edit/:id',

isAuthenticated,

(req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            '../public/edit.html'
        )
    );
});

router.get(
'/logout',

(req, res) => {

    req.session.destroy(() => {

        res.redirect(
            '/login.html'
        );
    });
});

router.post(
'/api/login',

(req, res) => {

    const {
        username,
        password
    } = req.body;

    const admin =
        db.prepare(`
            SELECT *
            FROM admins
            WHERE username = ?
        `).get(username);

    if (!admin) {

        return res.json({

            success: false,

            message:
            'Invalid Username'
        });
    }

    const valid =
        bcrypt.compareSync(
            password,
            admin.password
        );

    if (!valid) {

        return res.json({

            success: false,

            message:
            'Invalid Password'
        });
    }

    req.session.loggedIn = true;

    res.json({
        success: true
    });
});

module.exports =
    router;
