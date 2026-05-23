const express =
    require('express');

const bcrypt =
    require('bcrypt');

const path =
    require('path');

const supabase =
    require('../lib/supabase');

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

async (req, res) => {

    const {
        username,
        password
    } = req.body;

    const {
        data,
        error
    } = await supabase

        .from('admins')

        .select('*')

        .eq(
            'username',
            username
        );

    if (error) {

        console.log(
            'LOGIN ERROR:',
            error
        );

        return res.json({

            success: false,

            message:
            'Server Error'
        });
    }

    const admin =
        data?.[0];
console.log('LOGIN DATA:', data);
console.log('LOGIN ERROR:', error);

    if (!admin) {

        return res.json({

            success: false,

            message:
            'Invalid Username'
        });
    }

    const valid =
    password ===
    admin.password;

    if (!valid) {

        return res.json({

            success: false,

            message:
            'Invalid Password'
        });
    }

    req.session.loggedIn = true;

    req.session.save(() => {

        res.json({
            success: true
        });
    });
});

module.exports =
    router;
