const express =
    require('express');

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

function normalize(id) {

    return id

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()
        .toUpperCase();
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
'/api/logs',

isAuthenticated,

async (req, res) => {

    const page =
        Number(req.query.page) || 1;

    const limit = 50;

    const offset =
        (page - 1) * limit;

    const {
        data,
        error,
        count
    } = await supabase

        .from('break_summary')

        .select('*', {
            count: 'exact'
        })

        .order('id', {
            ascending: false
        })

        .range(
            offset,
            offset + limit - 1
        );

    if (error) {

        console.log(error);

        return res.json({

            rows: [],

            totalPages: 0
        });
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
                    found?.name
                    || ''
            };
        });

    res.json({

        rows,

        totalPages:
            Math.ceil(
                count / limit
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

module.exports =
    router;
