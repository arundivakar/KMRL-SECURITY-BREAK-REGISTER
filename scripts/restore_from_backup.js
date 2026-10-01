/**
 * KMRL Security Break Register - Offline Disaster Recovery Script
 * Restores employees and break_summary from local JSON backups.
 * 
 * Usage: node scripts/restore_from_backup.js
 */

const fs = require('fs');
const path = require('path');
const projectDir = path.resolve(__dirname, '..');
const { createClient } = require(path.join(projectDir, 'node_modules/@supabase/supabase-js'));
require(path.join(projectDir, 'node_modules/dotenv')).config({ path: path.join(projectDir, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const backupDir = path.join(projectDir, 'backup');

async function restore() {
    console.log('--- EMERGENCY RESTORE FROM LOCAL BACKUP ---');

    const empFile = path.join(backupDir, 'backup_employees_406.json');
    const breakFile = path.join(backupDir, 'backup_break_summary_24005.json');

    if (!fs.existsSync(empFile) || !fs.existsSync(breakFile)) {
        throw new Error('Backup files missing! Cannot restore.');
    }

    const employees = JSON.parse(fs.readFileSync(empFile, 'utf8'));
    const breaks = JSON.parse(fs.readFileSync(breakFile, 'utf8'));

    console.log(`Loaded ${employees.length} employees and ${breaks.length} breaks from disk.`);

    // 1. Restore employees in batches
    console.log('Restoring employees...');
    const empBatchSize = 100;
    for (let i = 0; i < employees.length; i += empBatchSize) {
        const batch = employees.slice(i, i + empBatchSize);
        const { error } = await supabase.from('employees').upsert(batch);
        if (error) throw new Error(`Error restoring employees batch at ${i}: ${error.message}`);
    }
    console.log('Employees restored successfully.');

    // 2. Restore break_summary in batches
    console.log('Restoring break_summary...');
    const breakBatchSize = 500;
    for (let i = 0; i < breaks.length; i += breakBatchSize) {
        const batch = breaks.slice(i, i + breakBatchSize);
        const { error } = await supabase.from('break_summary').upsert(batch);
        if (error) throw new Error(`Error restoring breaks batch at ${i}: ${error.message}`);
        process.stdout.write(`  Restored ${Math.min(i + breakBatchSize, breaks.length)} / ${breaks.length}\r`);
    }
    console.log('\nBreak summary restored successfully.');
    console.log('Restore finished 100%!');
}

module.exports = { restore };

if (require.main === module) {
    restore().catch(err => {
        console.error('RESTORE FAILED:', err);
        process.exit(1);
    });
}
