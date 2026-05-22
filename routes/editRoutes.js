const express =
    require('express');

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
'/api/edit-entry/:id',

isAuthenticated,

async (req, res) => {

    const id =

        Number(req.params.id);

    if (isNaN(id)) {

        return res.json({});
    }

    const {
        data,
        error
    } = await supabase

        .from('break_summary')

        .select('*')

        .eq(
            'id',
            id
        )

        .single();

    if (error || !data) {

        console.log(
            'EDIT FETCH ERROR:',
            error
        );

        return res.json({});
    }

    const {
        data: employees
    } = await supabase

        .from('employees')

        .select('*');

    const found =
        employees.find(emp =>

            normalize(
                emp.emp_id
            )

            ===

            normalize(
                data.emp_id
            )
        );

    data.name =
        found?.name || '';

    res.json(data);
});

router.post(
'/api/edit-entry/:id',

isAuthenticated,

async (req, res) => {

    const id =

        Number(req.params.id);

    if (isNaN(id)) {

        return res.json({
            success: false
        });
    }

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

        Number(break1 || 0) +

        Number(break2 || 0) +

        Number(break3 || 0) +

        Number(break4 || 0) +

        Number(break5 || 0) +

        Number(break6 || 0);

    const {
        error
    } = await supabase

        .from('break_summary')

        .update({

            emp_id:
                normalize(emp_id),

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

            edited_at:
                new Date()
                .toISOString()

        })

        .eq(
            'id',
            id
        );

    if (error) {

        console.log(
            'EDIT UPDATE ERROR:',
            error
        );

        return res.json({
            success: false
        });
    }

    res.json({
        success: true
    });
});

module.exports =
    router;
