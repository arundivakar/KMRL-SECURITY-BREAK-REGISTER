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
'/api/edit-entry/:id',

isAuthenticated,

(req, res) => {

    const row =
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

            WHERE b.id = ?

        `).get(
            req.params.id
        );

    res.json(row);
});

router.post(
'/api/edit-entry/:id',

isAuthenticated,

(req, res) => {

    const id =
        req.params.id;

    const {

        emp_id,

        station,

        shift_type,

        break1,

        break2,

        break3,

        break4,

        break5,

        break6,

        edited_by_name,

        edited_by_emp,

        edit_reason

    } = req.body;

    const total =

        Number(break1) +
        Number(break2) +
        Number(break3) +
        Number(break4) +
        Number(break5) +
        Number(break6);

    db.prepare(`

        UPDATE break_summary

        SET

            emp_id = ?,

            station = ?,

            shift_type = ?,

            break1 = ?,

            break2 = ?,

            break3 = ?,

            break4 = ?,

            break5 = ?,

            break6 = ?,

            total = ?,

            edited_by_name = ?,

            edited_by_emp = ?,

            edit_reason = ?,

            edited_at =
                datetime('now')

        WHERE id = ?

    `).run(

        emp_id,

        station,

        shift_type,

        break1,

        break2,

        break3,

        break4,

        break5,

        break6,

        total,

        edited_by_name,

        edited_by_emp,

        edit_reason,

        id
    );

    res.json({
        success: true
    });
});

module.exports =
    router;
