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

router.get(
'/api/edit-entry/:id',

isAuthenticated,

async (req, res) => {

    const { data, error } =
        await supabase

        .from('break_summary')

        .select('*')

        .eq(
            'id',
            req.params.id
        )

        .single();

    if (error) {

        return res.json({
            success: false,
            error:
                error.message
        });
    }

    res.json(data);
});

router.post(
'/api/edit-entry/:id',

isAuthenticated,

async (req, res) => {

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

    const { error } =
        await supabase

        .from('break_summary')

        .update({

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

            edited_at:
                new Date()
                .toISOString()

        })

        .eq('id', id);

    if (error) {

        console.log(error);

        return res.json({

            success: false,

            error:
                error.message
        });
    }

    res.json({
        success: true
    });
});

module.exports =
    router;
