const express =
    require('express');

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
'/api/logs',

isAuthenticated,

(req, res) => {

    const page =
        Number(req.query.page) || 1;

    const limit = 50;

    const offset =
        (page - 1) * limit;

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

            LIMIT ?

            OFFSET ?

        `).all(
            limit,
            offset
        );

    const totalRows =
        db.prepare(`

            SELECT COUNT(*) as count

            FROM break_summary

        `).get().count;

    res.json({

        rows,

        totalPages:
            Math.ceil(
                totalRows / limit
            )
    });
});

router.get(
'/today-exceeded',

isAuthenticated,

(req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/todayExceeded.html'
        )
    );
});

router.get(
'/habitual-offenders',

isAuthenticated,

(req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/habitual.html'
        )
    );
});

router.get(
'/api/today-exceeded',

isAuthenticated,

(req, res) => {

    const today =
        new Date()
        .toISOString()
        .split('T')[0];

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

            WHERE
                b.entry_date = ?
                AND b.total > 40

            ORDER BY b.total DESC

        `).all(today);

    res.json(rows);
});

router.get(
'/api/habitual-offenders',

isAuthenticated,

(req, res) => {

    const rows =
        db.prepare(`

            SELECT

                b.emp_id,

                e.name,

                COUNT(*) as exceed_count,

                MAX(b.entry_date)
                as latest_date,

                MAX(b.station)
                as latest_station

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

            WHERE b.total > 40

            GROUP BY b.emp_id

            HAVING COUNT(*) >= 3

            ORDER BY exceed_count DESC

        `).all();

    res.json(rows);
});

module.exports =
    router;
