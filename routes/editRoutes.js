const express =
    require('express');

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

/* ===== NORMALIZE EMP ID ===== */

function normalize(id) {

    return String(id || '')

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()

        .toUpperCase();
}

/* ===== GET ENTRY ===== */

router.get(

'/api/edit-entry/:id',

isAuthenticated,

async (req, res) => {

    const id =
        Number(req.params.id);

    if (isNaN(id)) {

        return res.json({});
    }

    /* ===== FETCH ENTRY ===== */

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

    /* ===== FETCH EMPLOYEE ===== */

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

/* ===== SAVE EDIT ===== */

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

    /* ===== BODY ===== */

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

    /* ===== BREAK VALUES ===== */

    const b1 =
        Number(break1 || 0);

    const b2 =
        Number(break2 || 0);

    const b3 =
        Number(break3 || 0);

    const b4 =
        Number(break4 || 0);

    const b5 =
        Number(break5 || 0);

    const b6 =
        Number(break6 || 0);

    /* ===== TOTAL ===== */

    const total =

        Math.max(0, b1) +

        Math.max(0, b2) +

        Math.max(0, b3) +

        Math.max(0, b4) +

        Math.max(0, b5) +

        Math.max(0, b6);

    /* ===== RUNNING STATUS ===== */

    const current_open_break =

        [
            b1,
            b2,
            b3,
            b4,
            b5,
            b6
        ]

        .some(
            value => value < 0
        );

    /* ===== UPDATE ===== */

    const {
        error
    } = await supabase

        .from('break_summary')

        .update({

            emp_id:
                normalize(emp_id),

            station,

            shift_type,

            break1: b1,

            break2: b2,

            break3: b3,

            break4: b4,

            break5: b5,

            break6: b6,

            total,

            current_open_break,

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

    /* ===== ERROR ===== */

    if (error) {

        console.log(
            'EDIT UPDATE ERROR:',
            error
        );

        return res.json({
            success: false
        });
    }

    /* ===== SUCCESS ===== */

    res.json({
        success: true
    });
});

/* ===== EXPORT ===== */

module.exports =
    router;
