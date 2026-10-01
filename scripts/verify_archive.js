/**
 * KMRL Break Register - Comprehensive Archive Integrity Verification
 * Verifies live archive tables against original data and local backup.
 */

const fs = require('fs');
const path = require('path');
const projectDir = path.resolve(__dirname, '..');
const { createClient } = require(path.join(projectDir, 'node_modules/@supabase/supabase-js'));
require(path.join(projectDir, 'node_modules/dotenv')).config({ path: path.join(projectDir, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const backupDir = path.join(projectDir, 'backup');

async function runVerification() {
    console.log('================================================================');
    console.log('KMRL SECURITY BREAK REGISTER — ARCHIVE INTEGRITY VERIFICATION');
    console.log('================================================================\n');

    let allPassed = true;

    // 1. Check archive_employees
    console.log('--- 1. Verifying archive_employees ---');
    const { count: archEmpCount, error: archEmpErr } = await supabase
        .from('archive_employees')
        .select('*', { count: 'exact', head: true });

    if (archEmpErr) {
        console.error('FAIL: archive_employees query error:', archEmpErr.message);
        return false;
    }
    console.log(`Archived employees count: ${archEmpCount} (Expected: 406)`);
    if (archEmpCount !== 406) {
        console.error(`FAIL: Expected 406 archived employees, found ${archEmpCount}`);
        allPassed = false;
    } else {
        console.log('PASS: Exact count is 406');
    }

    // 2. Check archive_break_summary
    console.log('\n--- 2. Verifying archive_break_summary ---');
    const { count: archBreakCount, error: archBreakErr } = await supabase
        .from('archive_break_summary')
        .select('*', { count: 'exact', head: true });

    if (archBreakErr) {
        console.error('FAIL: archive_break_summary query error:', archBreakErr.message);
        return false;
    }

    const breakBackupFile = fs.existsSync(path.join(backupDir, 'backup_break_summary_24020.json'))
        ? path.join(backupDir, 'backup_break_summary_24020.json')
        : path.join(backupDir, 'backup_break_summary_24004.json');
    const breakBackup = JSON.parse(fs.readFileSync(breakBackupFile, 'utf8'));
    const expectedBreaks = breakBackup.length;

    console.log(`Archived break records count: ${archBreakCount} (Expected: ${expectedBreaks})`);
    if (archBreakCount !== expectedBreaks) {
        console.error(`FAIL: Expected ${expectedBreaks} archived breaks, found ${archBreakCount}`);
        allPassed = false;
    } else {
        console.log(`PASS: Exact count is ${expectedBreaks}`);
    }

    // 3. Specifically verify newest record ID 24055 is in archive
    console.log('\n--- 3. Verifying record ID 24055 in archive ---');
    const { data: rec24055, error: recErr } = await supabase
        .from('archive_break_summary')
        .select('*')
        .eq('id', 24055);

    if (recErr || !rec24055 || rec24055.length === 0) {
        console.error('FAIL: Record ID 24055 not found in archive_break_summary!');
        allPassed = false;
    } else {
        console.log('PASS: Record ID 24055 confirmed in archive:', rec24055[0]);
    }

    // 4. Verify archive_habitual_offenders
    console.log('\n--- 4. Verifying archive_habitual_offenders ---');
    const { count: archHabCount, error: archHabErr } = await supabase
        .from('archive_habitual_offenders')
        .select('*', { count: 'exact', head: true });

    if (archHabErr) {
        console.error('FAIL: archive_habitual_offenders query error:', archHabErr.message);
        allPassed = false;
    } else {
        console.log(`Archived habitual offenders count: ${archHabCount} (Expected: 193)`);
        if (archHabCount !== 193) {
            console.error(`FAIL: Expected 193 habitual offenders, found ${archHabCount}`);
            allPassed = false;
        } else {
            console.log('PASS: Exact count is 193');
        }
    }

    // 5. Compare with local backup
    console.log('\n--- 5. Cross-checking with Local Backup Files ---');
    const empBackup = JSON.parse(fs.readFileSync(path.join(backupDir, 'backup_employees_406.json'), 'utf8'));

    if (empBackup.length === archEmpCount) {
        console.log(`PASS: Backup employees (${empBackup.length}) === Archive employees (${archEmpCount})`);
    } else {
        console.error('FAIL: Count mismatch between backup and archive employees!');
        allPassed = false;
    }

    if (breakBackup.length === archBreakCount) {
        console.log(`PASS: Backup breaks (${breakBackup.length}) === Archive breaks (${archBreakCount})`);
    } else {
        console.error('FAIL: Count mismatch between backup and archive breaks!');
        allPassed = false;
    }

    console.log('\n================================================================');
    if (allPassed) {
        console.log('PRE-RESET VERIFICATION RESULT: ALL CHECKS PASSED (100% SUCCESS)');
        console.log('================================================================');
        return true;
    } else {
        console.error('PRE-RESET VERIFICATION RESULT: FAILED! DO NOT PROCEED TO RESET');
        console.log('================================================================');
        return false;
    }
}

if (require.main === module) {
    runVerification().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(err => {
        console.error('Verification error:', err);
        process.exit(1);
    });
}

module.exports = { runVerification };
