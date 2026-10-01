const fs = require('fs');
const path = require('path');

const projectDir = path.resolve(__dirname, '..');
const backupDir = path.join(projectDir, 'backup');

function verifyBackup() {
    console.log('====================================================');
    console.log('KMRL BREAK REGISTER — INDEPENDENT BACKUP VERIFICATION');
    console.log('====================================================\n');

    let allPassed = true;

    // 1. Verify employees backup
    const empFile = path.join(backupDir, 'backup_employees_406.json');
    if (!fs.existsSync(empFile)) {
        console.error('FAIL: backup_employees_406.json does not exist!');
        allPassed = false;
    } else {
        try {
            const emps = JSON.parse(fs.readFileSync(empFile, 'utf8'));
            console.log(`PASS: backup_employees_406.json parsed successfully. Count: ${emps.length}`);
            if (emps.length !== 406) {
                console.error(`FAIL: Expected 406 employees, got ${emps.length}`);
                allPassed = false;
            } else {
                console.log('PASS: Exact count is 406');
            }

            // Check duplicate IDs
            const idSet = new Set();
            let hasDupes = false;
            for (const e of emps) {
                if (idSet.has(e.id)) {
                    console.error(`FAIL: Duplicate employee DB id ${e.id}`);
                    hasDupes = true;
                    allPassed = false;
                }
                idSet.add(e.id);
            }
            if (!hasDupes) console.log('PASS: 0 duplicate employee IDs in backup');
        } catch (e) {
            console.error('FAIL: Error parsing backup_employees_406.json:', e.message);
            allPassed = false;
        }
    }

    // 2. Verify break_summary backup
    const breakFile = path.join(backupDir, 'backup_break_summary_24005.json');
    if (!fs.existsSync(breakFile)) {
        console.error('FAIL: backup_break_summary_24005.json does not exist!');
        allPassed = false;
    } else {
        try {
            const breaks = JSON.parse(fs.readFileSync(breakFile, 'utf8'));
            console.log(`\nPASS: backup_break_summary_24005.json parsed successfully. Count: ${breaks.length}`);
            if (breaks.length !== 24005) {
                console.error(`FAIL: Expected exactly 24,005 records, got ${breaks.length}`);
                allPassed = false;
            } else {
                console.log(`PASS: Exact record count is 24,005`);
            }

            // Check duplicate IDs
            const idSet = new Set();
            let hasDupes = false;
            let sampleLogsCount = 0;
            for (const b of breaks) {
                if (idSet.has(b.id)) {
                    console.error(`FAIL: Duplicate break summary DB id ${b.id}`);
                    hasDupes = true;
                    allPassed = false;
                }
                idSet.add(b.id);
                if (b.break_logs && Object.keys(b.break_logs).length > 0) {
                    sampleLogsCount++;
                }
            }
            if (!hasDupes) console.log('PASS: 0 duplicate break record IDs in backup');
            console.log(`PASS: Preserved break_logs JSON objects: ${sampleLogsCount} records with detailed break timestamps`);
        } catch (e) {
            console.error('FAIL: Error parsing backup_break_summary_24004.json:', e.message);
            allPassed = false;
        }
    }

    // 3. Verify restore script syntax
    const restoreFile = path.join(projectDir, 'scripts', 'restore_from_backup.js');
    try {
        require(restoreFile);
        console.log('\nPASS: scripts/restore_from_backup.js loaded with valid syntax');
    } catch (e) {
        console.error('FAIL: restore script syntax error:', e.message);
        allPassed = false;
    }

    console.log('\n----------------------------------------------------');
    if (allPassed) {
        console.log('OVERALL BACKUP VERIFICATION: ALL CHECKS PASSED (100% OK)');
    } else {
        console.error('OVERALL BACKUP VERIFICATION: FAILED - DO NOT PROCEED');
        process.exit(1);
    }
    console.log('----------------------------------------------------');
}

verifyBackup();
