const express =
    require('express');

const supabase =
    require('../lib/supabase');

const router =
    express.Router();

/* ===== NORMALIZE ===== */

function normalize(id) {

    return String(id || '')

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()

        .toUpperCase();
}

//* ===== EMPLOYEE FETCH ===== */

router.get(

'/api/employee/:id',

async (req, res) => {

    const entered =

        normalize(
            req.params.id
        );

    const {
        data: employees,
        error
    } = await supabase

        .from('employees')

        .select('*');

    if (error) {

        console.log(
            'EMPLOYEE ERROR:',
            error
        );

        return res.json({
            found: false
        });
    }

    let found = null;

    for (const emp of employees) {

        if (

            normalize(
                emp.emp_id
            )

            ===

            entered
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

    /* ===== TODAY STATUS ===== */

    const today =

        new Date()
        .toISOString()
        .split('T')[0];

    const shift_type =

        req.query.shift_type || 'NORMAL';

    const {

        data: breakRows

    } = await supabase

        .from('break_summary')

        .select('*')

        .eq(
            'emp_id',
            entered
        )

        .eq(
            'entry_date',
            today
        )

        .eq(
            'shift_type',
            shift_type
        );

    const breakRow =
        breakRows?.[0];

    let total =
        0;

    let status =
        'No Break Started';

    if (breakRow) {

        total =
            Number(
                breakRow.total || 0
            );

        if (
            breakRow.current_open_break
        ) {

            status =

                `${breakRow.current_open_break} RUNNING`;

        } else {

            const completed =

                [

                    'Break 6',

                    'Break 5',

                    'Break 4',

                    'Break 3',

                    'Break 2',

                    'Break 1'

                ]

                .find(label => {

                    const column =

                        label
                        .toLowerCase()
                        .replace(' ', '');

                    return Number(
                        breakRow[column]
                    ) > 0;
                });

            if (completed) {

                status =
                    `${completed} COMPLETED`;
            }
        }
    }

    const balance =

        Math.max(
            0,
            40 - total
        );

    res.json({

        found: true,

        employee: found,

        total,

        balance,

        status
    });
});

/* ===== BREAK API ===== */

router.post(

'/api/breaks',

async (req, res) => {

    try {

        const {

            emp_id,

            station,

            shift_type,

            break_no,

            action

        } = req.body;

        const normalizedEmpId =

            normalize(emp_id);

        /* ===== VALID EMPLOYEE ===== */

        const {
            data: employeeRows
        } = await supabase

            .from('employees')

            .select('*');

        const validEmployee =

            employeeRows?.find(

                emp =>

                    normalize(emp.emp_id)

                    ===

                    normalizedEmpId
            );

        if (!validEmployee) {

            return res.json({

                message:
                'Invalid Employee Number'
            });
        }

        /* ===== DATE ===== */

        const today =

            new Date()
            .toISOString()
            .split('T')[0];

        /* ===== SESSION ===== */

        const currentHour =

            parseInt(

                new Date()
                .toLocaleString(

                    'en-US',

                    {
                        timeZone:
                        'Asia/Kolkata',

                        hour:
                        'numeric',

                        hour12:
                        false
                    }
                )
            );

        let shift_session =
            'NIGHT';

        if (
            currentHour >= 6
            &&
            currentHour < 14
        ) {

            shift_session =
                'MORNING';
        }

        else if (
            currentHour >= 14
            &&
            currentHour < 22
        ) {

            shift_session =
                'EVENING';
        }

        /* ===== FETCH ROW ===== */

        const {

            data: existingRows,

            error: selectError

        } = await supabase

            .from('break_summary')

            .select('*')

            .eq(
                'emp_id',
                normalizedEmpId
            )

            .eq(
                'entry_date',
                today
            )

            .eq(
                'shift_type',
                shift_type
            );

        if (selectError) {

            console.log(
                'SELECT ERROR:',
                selectError
            );

            return res.json({

                message:
                'Select failed'
            });
        }

        let row =
            existingRows?.[0];

        /* ===== STATION LOCK ===== */

        if (
            row &&
            row.station !== station
        ) {

            return res.json({

                message:
                'Station cannot be changed in same shift'
            });
        }

        /* ===== CREATE ROW ===== */

        if (!row) {

            const {
                error: insertError
            } = await supabase

                .from('break_summary')

                .insert([{

                    entry_date:
                        today,

                    emp_id:
                        normalizedEmpId,

                    station,

                    shift_type,

                    shift_session,

                    break1: 0,

                    break2: 0,

                    break3: 0,

                    break4: 0,

                    break5: 0,

                    break6: 0,

                    total: 0,

                    current_open_break:
                        null,

                    current_start_time:
                        null
                }]);

            if (insertError) {

                console.log(
                    'INSERT ERROR:',
                    insertError
                );

                return res.json({

                    message:
                    insertError.message
                });
            }

            const {
                data: newRows
            } = await supabase

                .from('break_summary')

                .select('*')

                .eq(
                    'emp_id',
                    normalizedEmpId
                )

                .eq(
                    'entry_date',
                    today
                )

                .eq(
                    'shift_type',
                    shift_type
                );

            row =
                newRows?.[0];
        }

        /* ===== BREAK MAP ===== */

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

        if (!column) {

            return res.json({

                message:
                'Invalid break'
            });
        }

        /* ===== START BREAK ===== */

        if (action === 'START') {

            const {
                data: latestRows
            } = await supabase

                .from('break_summary')

                .select('*')

                .eq(
                    'id',
                    row.id
                );

            const latestRow =
                latestRows?.[0];

            /* ===== RUNNING CHECK ===== */

            const hasRunningBreak =

                [
                    Number(latestRow.break1),
                    Number(latestRow.break2),
                    Number(latestRow.break3),
                    Number(latestRow.break4),
                    Number(latestRow.break5),
                    Number(latestRow.break6)
                ]

                .some(
                    value => value < 0
                );

            if (hasRunningBreak) {

                return res.json({

                    message:
                    'Complete previous break first'
                });
            }

            /* ===== PREVENT REUSE ===== */

            if (
                Number(
                    latestRow[column]
                ) !== 0
            ) {

                return res.json({

                    message:
                    `${break_no} already used in this shift`
                });
            }

            /* ===== START ===== */

            const {
                error: startError
            } = await supabase

                .from('break_summary')

                .update({

                    [column]:
                        -1,

                    station,

                    shift_type,

                    current_open_break:
                        break_no,

                    current_start_time:
                        new Date()
                        .toISOString()

                })

                .eq(
                    'id',
                    row.id
                );

            if (startError) {

                console.log(
                    'START ERROR:',
                    startError
                );

                return res.json({

                    message:
                    'Break start failed'
                });
            }

            return res.json({

                message:
                `${break_no} started`
            });
        }

        /* ===== COMPLETE BREAK ===== */

        if (action === 'COMPLETE') {

            const {
                data: latestRows
            } = await supabase

                .from('break_summary')

                .select('*')

                .eq(
                    'id',
                    row.id
                );

            const latestRow =
                latestRows?.[0];

            /* ===== VERIFY ACTIVE ===== */

            const isRunning =

                Number(
                    latestRow[column]
                ) < 0;

            if (!isRunning) {

                return res.json({

                    message:
                    'No active break found'
                });
            }

            const start =

                new Date(
                    latestRow.current_start_time
                );

            const now =
                new Date();

            const mins =

                Math.floor(

                    (now - start)

                    / 1000 / 60
                );

            /* ===== TOTAL ===== */

            const total =

                Math.max(
                    0,
                    Number(latestRow.break1 || 0)
                ) +

                Math.max(
                    0,
                    Number(latestRow.break2 || 0)
                ) +

                Math.max(
                    0,
                    Number(latestRow.break3 || 0)
                ) +

                Math.max(
                    0,
                    Number(latestRow.break4 || 0)
                ) +

                Math.max(
                    0,
                    Number(latestRow.break5 || 0)
                ) +

                Math.max(
                    0,
                    Number(latestRow.break6 || 0)
                ) +

                mins;

            /* ===== COMPLETE ===== */

            const {
                error: completeError
            } = await supabase

                .from('break_summary')

                .update({

                    [column]:
                        mins,

                    total,

                    current_open_break:
                        null,

                    current_start_time:
                        null

                })

                .eq(
                    'id',
                    row.id
                );

            if (completeError) {

                console.log(
                    'COMPLETE ERROR:',
                    completeError
                );

                return res.json({

                    message:
                    'Break complete failed'
                });
            }

            return res.json({

                message:
                `${break_no} completed`
            });
        }

        return res.json({

            message:
            'Invalid action'
        });

    } catch (err) {

        console.log(
            'SERVER ERROR:',
            err
        );

        res.json({

            message:
            'Server Error'
        });
    }
});

/* ===== EXPORT ===== */

module.exports =
    router;
