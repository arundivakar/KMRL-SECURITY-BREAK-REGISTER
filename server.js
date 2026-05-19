const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const db = new Database('./db/breaks.db');

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'kmrl-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static('public'));

db.prepare(`
CREATE TABLE IF NOT EXISTS breaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id TEXT,
    break_no TEXT,
    start_time TEXT,
    end_time TEXT,
    duration_minutes INTEGER,
    status TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id TEXT UNIQUE,
    name TEXT,
    designation TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
`).run();

const adminExists = db.prepare(`
SELECT * FROM admins WHERE username = ?
`).get('admin');

if (!adminExists) {

    const hashedPassword = bcrypt.hashSync('admin123', 10);

    db.prepare(`
        INSERT INTO admins (username, password)
        VALUES (?, ?)
    `).run('admin', hashedPassword);
}

function isAuthenticated(req, res, next) {

    if (req.session.loggedIn) {
        return next();
    }

    return res.redirect('/login.html');
}

app.post('/api/login', (req, res) => {

    const { username, password } = req.body;

    const admin = db.prepare(`
        SELECT * FROM admins
        WHERE username = ?
    `).get(username);

    if (!admin) {

        return res.json({
            success: false,
            message: 'Invalid username'
        });
    }

    const validPassword = bcrypt.compareSync(
        password,
        admin.password
    );

    if (!validPassword) {

        return res.json({
            success: false,
            message: 'Invalid password'
        });
    }

    req.session.loggedIn = true;

    res.json({
        success: true
    });
});

app.get('/logout', (req, res) => {

    req.session.destroy(() => {

        res.redirect('/login.html');
    });
});

app.post('/api/breaks', (req, res) => {

    const { emp_id, break_no, action } = req.body;

    if (action === 'START') {

        db.prepare(`
            INSERT INTO breaks
            (emp_id, break_no, start_time, status)
            VALUES (?, ?, datetime('now'), 'OPEN')
        `).run(emp_id, break_no);

        return res.json({
            message: `${break_no} started`
        });
    }

    if (action === 'COMPLETE') {

        const row = db.prepare(`
            SELECT * FROM breaks
            WHERE emp_id = ?
            AND break_no = ?
            AND status = 'OPEN'
            ORDER BY id DESC
            LIMIT 1
        `).get(emp_id, break_no);

        if (!row) {

            return res.json({
                message: 'No active break found'
            });
        }

        db.prepare(`
            UPDATE breaks
            SET
                end_time = datetime('now'),
                duration_minutes =
                    CAST(
                        (julianday(datetime('now')) - julianday(start_time))
                        * 24 * 60
                    AS INTEGER),
                status = 'CLOSED'
            WHERE id = ?
        `).run(row.id);

        return res.json({
            message: `${break_no} completed`
        });
    }
});

app.get('/api/employee/:emp_id', (req, res) => {

    const emp = db.prepare(`
        SELECT * FROM employees
        WHERE emp_id = ?
    `).get(req.params.emp_id);

    if (!emp) {

        return res.json({
            found: false
        });
    }

    res.json({
        found: true,
        employee: emp
    });
});

app.get('/dashboard', isAuthenticated, (req, res) => {

    res.sendFile(
        path.join(__dirname, 'public/dashboard.html')
    );
});

app.get('/api/logs', isAuthenticated, (req, res) => {

    const rows = db.prepare(`
        SELECT * FROM breaks
        ORDER BY id DESC
    `).all();

    res.json(rows);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server running on port ${PORT}`);
});
