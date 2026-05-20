const express = require('express');
const Database = require('better-sqlite3');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();

const db =
    new Database(

        path.join(
            __dirname,
            'db',
            'breaks.db'
        )
    );

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

function normalize(id) {

    return id

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()
        .toUpperCase();
}

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

app.get(
'/dashboard',

isAuthenticated,

(req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            'public/dashboard.html'
        )
    );
});

app.get(
'/edit/:id',

isAuthenticated,

(req, res) => {

    res.sendFile(

        path.join(
            __dirname,
            'public/edit.html'
        )
    );
});

app.get(
'/logout',

(req, res) => {

    req.session.destroy(() => {

        res.redirect(
            '/login.html'
        );
    });
});

app.post(
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

app.get(
'/api/employee/:id',

(req, res) => {

    const entered =
        normalize(
            req.params.id
        );

    const employees =
        db.prepare(`
            SELECT *
            FROM employees
        `).all();

    let found = null;

    for (const emp of employees) {

        if (
            normalize(emp.emp_id)
            === entered
        ) {

            found = emp;

            break;
        }
    }

    if (!found) {

        return res.json({
            found: false
        });
    }

    res.json({

        found: true,

        employee: found
    });
});

app.post(
'/api/breaks',

(req, res) => {

    const {

        emp_id,

        station,

        shift_type,

        break_no,

        action

    } = req.body;

    const today =
        new Date()
        .toISOString()
        .split('T')[0];

    let row =
        db.prepare(`

            SELECT *

            FROM break_summary

            WHERE
                emp_id = ?
                AND entry_date = ?

        `).get(
            emp_id,
            today
        );

    if (!row) {

        db.prepare(`

            INSERT INTO break_summary

            (
                entry_date,
                emp_id,
                station,
                shift_type
            )

            VALUES (?, ?, ?, ?)

        `).run(
            today,
            emp_id,
            station,
            shift_type
        );

        row =
            db.prepare(`

                SELECT *

                FROM break_summary

                WHERE
                    emp_id = ?
                    AND entry_date = ?

            `).get(
                emp_id,
                today
            );
    }

    db.prepare(`

        UPDATE break_summary

        SET
            station = ?,
            shift_type = ?

        WHERE id = ?

    `).run(
        station,
        shift_type,
        row.id
    );

    const map = {

        'Break 1': 'break1',
        'Break 2': 'break2',
        'Break 3': 'break3',
        'Break 4': 'break4',
        'Break 5': 'break5',
        'Break 6': 'break6'
    };

    const column =
        map[break_no];

    if (action === 'START') {

        if (
            row.current_open_break
        ) {

            return res.json({

                message:
                'Complete previous break first'
            });
        }

        db.prepare(`

            UPDATE break_summary

            SET

                current_open_break = ?,

                current_start_time =
                    datetime('now')

            WHERE id = ?

        `).run(
            break_no,
            row.id
        );

        return res.json({

            message:
            `${break_no} started`
        });
    }

    if (action === 'COMPLETE') {

        if (
            row.current_open_break
            !== break_no
        ) {

            return res.json({

                message:
                'No active break found'
            });
        }

        const duration =
            db.prepare(`

                SELECT

                CAST(

                    (

                        julianday(
                            datetime('now')
                        )

                        -

                        julianday(
                            current_start_time
                        )

                    )

                    * 24 * 60

                AS INTEGER)

                AS mins

                FROM break_summary

                WHERE id = ?

            `).get(row.id);

        const mins =
            duration.mins || 0;

        db.prepare(`

            UPDATE break_summary

            SET

                ${column} = ?,

                total =
                    break1 +
                    break2 +
                    break3 +
                    break4 +
                    break5 +
                    break6 +
                    ?,

                current_open_break = NULL,

                current_start_time = NULL

            WHERE id = ?

        `).run(
            mins,
            mins,
            row.id
        );

        return res.json({

            message:
            `${break_no} completed`
        });
    }
});

app.get(
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

        `).all();

    res.json(rows);
});

app.get(
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

app.post(
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

app.listen(3000, () => {

    console.log(
        'Server running on port 3000'
    );
});
