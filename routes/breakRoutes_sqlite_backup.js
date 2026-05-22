const express =
    require('express');

const db =
    require('../db/database');

const router =
    express.Router();

function normalize(id) {

    return id

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()
        .toUpperCase();
}

router.get(
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

router.post(
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

    const shift_session =
        shift_type === 'DOUBLE'
        ? 'DOUBLE'
        : 'NORMAL';

    let row =
        db.prepare(`

            SELECT *

            FROM break_summary

            WHERE
                emp_id = ?
                AND entry_date = ?
                AND shift_session = ?

        `).get(
            emp_id,
            today,
            shift_session
        );

    if (!row) {

        db.prepare(`

            INSERT INTO break_summary

            (
                entry_date,
                emp_id,
                station,
                shift_type,
                shift_session
            )

            VALUES (?, ?, ?, ?, ?)

        `).run(
            today,
            emp_id,
            station,
            shift_type,
            shift_session
        );

        row =
            db.prepare(`

                SELECT *

                FROM break_summary

                WHERE
                    emp_id = ?
                    AND entry_date = ?
                    AND shift_session = ?

            `).get(
                emp_id,
                today,
                shift_session
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

        const latestRow =
            db.prepare(`

                SELECT *

                FROM break_summary

                WHERE id = ?

            `).get(row.id);

        if (
            latestRow.current_open_break
        ) {

            return res.json({

                message:
                'Complete previous break first'
            });
        }

        if (
            Number(
                latestRow[column]
            ) > 0
        ) {

            return res.json({

                message:
                `${break_no} already used in this shift`
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

        const latestRow =
            db.prepare(`

                SELECT *

                FROM break_summary

                WHERE id = ?

            `).get(row.id);

        if (
            latestRow.current_open_break
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

module.exports =
    router;
