const express =
    require('express');

const path =
    require('path');

const supabase =
    require('../lib/supabase');

const router =
    express.Router();

/* ===== AUTH ===== */

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

/* ===== NORMALIZE ===== */

function normalize(id) {

    return String(id || '')

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()

        .toUpperCase();
}

/* ===== DASHBOARD ===== */

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

/* ===== LOGS API ===== */

router.get(

'/api/logs',

isAuthenticated,

async (req, res) => {

    const page =
        Number(req.query.page) || 1;

    const limit = 50;

    const offset =
        (page - 1) * limit;

    const station =
        req.query.station || '';

    const search =
        (req.query.search || '')
        .toLowerCase();

    /* ===== BASE QUERY ===== */

    let query = supabase

        .from('break_summary')

        .select('*');

    /* ===== STATION FILTER ===== */

    if (station) {

        query =

            query.eq(
                'station',
                station
            );
    }

    /* ===== ORDER ===== */

    query = query.order(

        'id',

        {
            ascending: false
        }
    );

    const {

        data,

        error

    } = await query;

    if (error) {

        console.log(error);

        return res.json({

            rows: [],

            totalPages: 0,

            totalLogs: 0,

            totalExceeded: 0,

            runningBreaks: 0
        });
    }

    /* ===== EMPLOYEE TABLE ===== */

    const {
        data: employees
    } = await supabase

        .from('employees')

        .select('*');

    /* ===== MERGE EMPLOYEE NAME ===== */

    let rows =

        (data || []).map(row => {

            const found =

                employees.find(emp =>

                    normalize(
                        emp.emp_id
                    )

                    ===

                    normalize(
                        row.emp_id
                    )
                );

            return {

                ...row,

                name:
                    found?.name || ''
            };
        });

    /* ===== SEARCH ===== */

    if (search) {

        rows = rows.filter(row =>

            row.emp_id
            ?.toString()
            .toLowerCase()
            .includes(search)

            ||

            row.name
            ?.toLowerCase()
            .includes(search)

            ||

            row.station
            ?.toLowerCase()
            .includes(search)
        );
    }

    /* ===== SUMMARY ===== */

    const totalLogs =
        rows.length;

    const totalExceeded =

        rows.filter(

            row =>

                Number(row.total) > 40
        ).length;

    const runningBreaks =

        rows.filter(row =>

            [
                Number(row.break1),
                Number(row.break2),
                Number(row.break3),
                Number(row.break4),
                Number(row.break5),
                Number(row.break6)
            ]

            .some(
                value => value < 0
            )
        ).length;

    /* ===== TOTAL PAGES ===== */

    const totalPages =

        Math.max(

            1,

            Math.ceil(
                rows.length / limit
            )
        );

    /* ===== PAGINATION ===== */

    const paginatedRows =

        rows.slice(
            offset,
            offset + limit
        );

    /* ===== RESPONSE ===== */

    res.json({

        rows:
            paginatedRows,

        totalPages,

        totalLogs,

        totalExceeded,

        runningBreaks
    });
});

/* ===== TODAY EXCEEDED ===== */

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

/* ===== HABITUAL PAGE ===== */

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

/* ===== TODAY EXCEEDED API ===== */

router.get(

'/api/today-exceeded',

isAuthenticated,

async (req, res) => {

    const today =

        new Date()
        .toISOString()
        .split('T')[0];

    const {

        data,

        error

    } = await supabase

        .from('break_summary')

        .select('*')

        .eq(
            'entry_date',
            today
        )

        .gt(
            'total',
            40
        );

    if (error) {

        console.log(error);

        return res.json([]);
    }

    const {
        data: employees
    } = await supabase

        .from('employees')

        .select('*');

    const rows =

        (data || []).map(row => {

            const found =

                employees.find(emp =>

                    normalize(
                        emp.emp_id
                    )

                    ===

                    normalize(
                        row.emp_id
                    )
                );

            return {

                ...row,

                name:
                    found?.name || ''
            };
        });

    res.json(rows);
});

/* ===== HABITUAL API ===== */

router.get(

'/api/habitual-offenders',

isAuthenticated,

async (req, res) => {

    const page =
        Number(req.query.page) || 1;

    const limit = 50;

    const offset =
        (page - 1) * limit;

    const {

        data,

        error

    } = await supabase

        .from('habitual_offenders')

        .select('*');

    if (error) {

        console.log(error);

        return res.json({

            rows: [],

            totalPages: 0
        });
    }

    const grouped = {};

    for (const row of data || []) {

        const id =

            normalize(
                row.emp_id
            );

        grouped[id] = {

            emp_id: id,

            total_violations:
                row.total_violations || 0,

            latest_date:
                row.latest_date || '',

            latest_station:
                row.latest_station || ''
        };
    }

    const {
        data: employees
    } = await supabase

        .from('employees')

        .select('*');

    const result =

        Object.values(grouped)

        .sort(

            (a, b) =>

                b.total_violations
                -
                a.total_violations
        )

        .map(row => {

            const found =

                employees.find(emp =>

                    normalize(
                        emp.emp_id
                    )

                    ===

                    normalize(
                        row.emp_id
                    )
                );

            return {

                ...row,

                name:
                    found?.name || ''
            };
        });

    const paginated =

        result.slice(
            offset,
            offset + limit
        );

    res.json({

        rows:
            paginated,

        totalPages:

            Math.ceil(
                result.length / limit
            )
    });
});

/* ===== EXPORT ===== */

module.exports =
    router;
