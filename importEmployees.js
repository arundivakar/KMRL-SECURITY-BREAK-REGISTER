const fs = require('fs');

const Database =
    require('better-sqlite3');

const db =
    new Database('./db/breaks.db');

const insert =
    db.prepare(`

    INSERT OR REPLACE INTO employees

    (
        emp_id,
        name,
        designation
    )

    VALUES (?, ?, ?)

`);

const data =
    fs.readFileSync(
        'employees.csv',
        'utf8'
    );

const lines =
    data.split('\n');

for (let i = 1; i < lines.length; i++) {

    const line =
        lines[i].trim();

    if (!line) continue;

    const parts =
        line.split(',');

    if (parts.length < 3) continue;

    const emp_id =
        parts[0].trim();

    const name =
        parts[1].trim();

    const designation =
        parts[2].trim();

    insert.run(
        emp_id,
        name,
        designation
    );

    console.log(
        'Imported:',
        emp_id
    );
}

console.log(
    'Employee import completed'
);
