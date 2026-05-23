const express =
    require('express');

const supabase =
    require('../lib/supabase');

const router =
    express.Router();

function normalize(id) {

    return String(id || '')

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()
        .toUpperCase();
}

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

        const today =
            new Date()
            .toISOString()
            .split('T')[0];

        const hour = new Date().getHours();

let shift_session = 'NIGHT';

if (hour >= 6 && hour < 14) {

    shift_session = 'MORNING';

} else if (hour >= 14 && hour < 22) {

    shift_session = 'EVENING';
}

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
                'shift_session',
                shift_session
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

                    total: 0
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
                    'shift_session',
                    shift_session
                );

            row =
                newRows?.[0];
        }

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

            const {
                error: startError
            } = await supabase

                .from('break_summary')

                .update({

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

            if (
                latestRow.current_open_break
                !== break_no
            ) {

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

            const total =

                Number(
                    latestRow.break1 || 0
                ) +

                Number(
                    latestRow.break2 || 0
                ) +

                Number(
                    latestRow.break3 || 0
                ) +

                Number(
                    latestRow.break4 || 0
                ) +

                Number(
                    latestRow.break5 || 0
                ) +

                Number(
                    latestRow.break6 || 0
                ) +

                mins;

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

module.exports =
    router;
