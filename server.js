const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const db = new Database('./db/breaks.db');

app.use(cors());
app.use(express.json());
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

app.get('/logs', (req, res) => {

    const rows = db.prepare(`
        SELECT * FROM breaks
        ORDER BY id DESC
    `).all();

    let html = `
    <html>
    <head>
        <title>Break Logs</title>

        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">

        <style>

            body {
                font-family: Arial;
                padding: 15px;
                background: #f2f2f2;
            }

            h2 {
                text-align: center;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                background: white;
            }

            th, td {
                border: 1px solid #ccc;
                padding: 10px;
                text-align: center;
                font-size: 14px;
            }

            th {
                background: #007bff;
                color: white;
            }

            tr:nth-child(even) {
                background: #f9f9f9;
            }

        </style>
    </head>

    <body>

    <h2>KMRL TCS Break Logs</h2>

    <table>

        <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Break</th>
            <th>Start</th>
            <th>End</th>
            <th>Minutes</th>
            <th>Status</th>
        </tr>
    `;

    rows.forEach(row => {

        html += `
        <tr>
            <td>${row.id}</td>
            <td>${row.emp_id}</td>
            <td>${row.break_no}</td>
            <td>${row.start_time || ''}</td>
            <td>${row.end_time || ''}</td>
            <td>${row.duration_minutes || ''}</td>
            <td>${row.status}</td>
        </tr>
        `;
    });

    html += `
    </table>

    </body>
    </html>
    `;

    res.send(html);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
