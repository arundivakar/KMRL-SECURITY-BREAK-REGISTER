const express =
    require('express');

const path =
    require('path');

const supabase =
    require('../lib/supabase');

const { getEmployees } =
    require('../lib/employeeCache');


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
        const filter =
    req.query.filter || '';

    /* ===== BASE QUERY ===== */

    let query = supabase

    .from('break_summary')

    .select('*', { count: 'exact' });

    /* ===== STATION FILTER ===== */

    if (station) {

        query =

            query.eq(
                'station',
                station
            );
    }
    if (search) {

    query = query.or(
    `emp_id.ilike.%${search}%,station.ilike.%${search}%`
);
}
 /* ===== DASHBOARD FILTER ===== */

if (filter === 'exceeded') {

    query = query.gt(
        'total',
        40
    );
}

if (filter === 'running') {

    query = query.not(
        'current_open_break',
        'is',
        null
    );
}
console.log('FILTER:', filter);

    /* ===== ORDER ===== */

        const {

    data,

    error,

    count

} = await query

    .order(
        'id',
        {
            ascending: false
        }
    )

    .range(
        offset,
        offset + limit - 1
    );

console.log('COUNT:', count);
console.log('ROWS RETURNED:', data?.length);

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

    const employees = await getEmployees();

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

   

    /* ===== SUMMARY ===== */

    const totalLogs =
    count || 0;

    const {
    count: totalExceeded
} = await supabase

    .from('break_summary')

    .select('*', {
        count: 'exact',
        head: true
    })

    .gt(
        'total',
        40
    );

const {
    count: runningBreaks
} = await supabase

    .from('break_summary')

    .select('*', {
        count: 'exact',
        head: true
    })

    .not(
        'current_open_break',
        'is',
        null
    );

    /* ===== SC WARNINGS ===== */
    
    let scWarnings = [];
    const currentHour = parseInt(
        new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: 'numeric',
            hour12: false
        })
    );

    if (currentHour >= 14 || currentHour >= 22) {
        const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        // We just use Date formatting to get local YYYY-MM-DD
        const todayStr = new Date(today).toISOString().split('T')[0];
        // Note: the backend uses new Date().toISOString().split('T')[0] for entry_date in breakRoutes
        const entryDateToday = new Date().toISOString().split('T')[0]; 

        const { data: runningData } = await supabase
            .from('break_summary')
            .select('station, shift_session')
            .eq('entry_date', entryDateToday)
            .not('current_open_break', 'is', null);

        if (runningData) {
            let morningStations = new Set();
            let eveningStations = new Set();

            for (let r of runningData) {
                if (r.shift_session === 'MORNING' && currentHour >= 14) {
                    morningStations.add(r.station);
                }
                if (r.shift_session === 'EVENING' && currentHour >= 22) {
                    eveningStations.add(r.station);
                }
            }

            if (morningStations.size > 0) {
                scWarnings.push(`⚠️ URGENT: Station Controllers at [${Array.from(morningStations).join(', ')}] - please close pending MORNING breaks immediately!`);
            }
            if (eveningStations.size > 0) {
                scWarnings.push(`⚠️ URGENT: Station Controllers at [${Array.from(eveningStations).join(', ')}] - please close pending EVENING breaks immediately!`);
            }
        }
    }

    /* ===== TOTAL PAGES ===== */

    const totalPages =

    Math.max(

        1,

        Math.ceil(
            (count || 0) / limit
        )
    );

    /* ===== PAGINATION ===== */

    
    /* ===== RESPONSE ===== */

   res.json({

    rows:
        rows,

    totalPages,

    totalLogs,

    totalExceeded,

    runningBreaks,

    scWarnings
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

    const employees = await getEmployees();

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

    const employees = await getEmployees();

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
