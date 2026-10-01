const express = require('express');
const path = require('path');
const supabase = require('../lib/supabase');

const router = express.Router();

/* ===== AUTH ===== */
function isAuthenticated(req, res, next) {
    if (req.session && req.session.loggedIn) {
        return next();
    }
    res.redirect('/login.html');
}

/* ===== NORMALIZE ID ===== */
function normalize(id) {
    return String(id || '')
        .replace(/\s/g, '')
        .replace('TCSEK', '')
        .trim()
        .toUpperCase();
}

// In-memory cache for archived employees to keep archive fast
let cachedArchivedEmployees = null;
let lastArchivedFetch = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour (archive is static)

async function getArchivedEmployees() {
    const now = Date.now();
    if (!cachedArchivedEmployees || now - lastArchivedFetch > CACHE_DURATION_MS) {
        const { data, error } = await supabase
            .from('archive_employees')
            .select('*');
        if (!error && data) {
            cachedArchivedEmployees = data;
            lastArchivedFetch = now;
        }
    }
    return cachedArchivedEmployees || [];
}

/* ===== ARCHIVE HTML PAGE ===== */
router.get('/archive', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/archive.html'));
});

/* ===== ARCHIVE LOGS API ===== */
router.get('/api/archive/logs', isAuthenticated, async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 50;
        const offset = (page - 1) * limit;

        const station = req.query.station || '';
        const search = (req.query.search || '').trim().toLowerCase();
        const dateFrom = req.query.dateFrom || '';
        const dateTo = req.query.dateTo || '';
        const filter = req.query.filter || '';

        let query = supabase
            .from('archive_break_summary')
            .select('*', { count: 'exact' });

        if (station) {
            query = query.eq('station', station);
        }

        if (dateFrom) {
            query = query.gte('entry_date', dateFrom);
        }

        if (dateTo) {
            query = query.lte('entry_date', dateTo);
        }

        if (filter === 'exceeded') {
            query = query.gt('total', 40);
        }

        // Check if searching by name or station or ID
        if (search) {
            const normSearch = normalize(search);
            // Search emp_id or station directly
            query = query.or(`emp_id.ilike.%${normSearch}%,station.ilike.%${search}%`);
        }

        const { data, error, count } = await query
            .order('id', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Archive query error:', error);
            return res.json({ rows: [], totalPages: 0, totalLogs: 0 });
        }

        // Attach employee names from archive_employees
        const archivedEmployees = await getArchivedEmployees();
        const rows = (data || []).map(row => {
            const found = archivedEmployees.find(emp =>
                normalize(emp.emp_id) === normalize(row.emp_id)
            );
            return {
                ...row,
                name: found?.name || ''
            };
        });

        const totalPages = Math.max(1, Math.ceil((count || 0) / limit));

        res.json({
            rows,
            totalPages,
            totalLogs: count || 0
        });
    } catch (err) {
        console.error('Archive server error:', err);
        res.status(500).json({ error: 'Server error loading archive' });
    }
});

/* ===== ARCHIVE STATS API ===== */
router.get('/api/archive/stats', isAuthenticated, async (req, res) => {
    try {
        const { count: totalBreaks } = await supabase
            .from('archive_break_summary')
            .select('*', { count: 'exact', head: true });

        const { count: totalExceeded } = await supabase
            .from('archive_break_summary')
            .select('*', { count: 'exact', head: true })
            .gt('total', 40);

        const { count: totalGuards } = await supabase
            .from('archive_employees')
            .select('*', { count: 'exact', head: true });

        res.json({
            totalBreaks: totalBreaks || 0,
            totalExceeded: totalExceeded || 0,
            totalGuards: totalGuards || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching archive stats' });
    }
});

/* ===== ARCHIVE HABITUAL API ===== */
router.get('/api/archive/habitual', isAuthenticated, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('archive_habitual_offenders')
            .select('*')
            .order('total_violations', { ascending: false });

        if (error) return res.json([]);

        const archivedEmployees = await getArchivedEmployees();
        const rows = (data || []).map(row => {
            const found = archivedEmployees.find(emp =>
                normalize(emp.emp_id) === normalize(row.emp_id)
            );
            return {
                ...row,
                name: found?.name || ''
            };
        });

        res.json(rows);
    } catch (err) {
        res.status(500).json([]);
    }
});

module.exports = router;
