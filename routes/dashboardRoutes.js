const express =
    require('express');

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
'/api/logs',

isAuthenticated,

(req, res) => {

    const rows =
        db.prepare(`

            SELECT

                b.*,

                e.name

            FROM break_summary b

            LEFT JOIN employees e

            ON
                REPLACE(
                    REPLACE(
                        b.emp_id,
                        ' ',
                        ''
                    ),
                    'TCSEK',
                    ''
                )

                =

                REPLACE(
                    REPLACE(
                        e.emp_id,
                        ' ',
                        ''
                    ),
                    'TCSEK',
                    ''
                )

            ORDER BY b.id DESC

            LIMIT 50

        `).all();

    res.json(rows);
});

module.exports =
    router;
