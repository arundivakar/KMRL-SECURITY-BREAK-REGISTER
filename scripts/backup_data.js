const fs = require('fs');
const path = require('path');
const projectDir = path.resolve(__dirname, '..');
const { createClient } = require(path.join(projectDir, 'node_modules/@supabase/supabase-js'));
require(path.join(projectDir, 'node_modules/dotenv')).config({ path: path.join(projectDir, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const backupDir = path.join(projectDir, 'backup');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function exportTable(tableName, orderBy = 'id', step = 1000) {
    console.log(`Starting export for table: ${tableName}...`);
    let rows = [];
    let from = 0;

    while (true) {
        let query = supabase.from(tableName).select('*').range(from, from + step - 1);
        if (orderBy) {
            query = query.order(orderBy, { ascending: true });
        }
        const { data, error } = await query;
        if (error) {
            throw new Error(`Export error on table ${tableName} at offset ${from}: ${error.message}`);
        }
        if (!data || data.length === 0) break;
        rows.push(...data);
        process.stdout.write(`  Fetched ${rows.length} rows...\r`);
        if (data.length < step) break;
        from += step;
    }
    console.log(`\nExport complete for ${tableName}: Total ${rows.length} records.`);
    return rows;
}

async function runBackup() {
    console.log('====================================================');
    console.log('KMRL BREAK REGISTER — PRE-MIGRATION BACKUP GENERATION');
    console.log('====================================================\n');

    // 1. Export employees
    const employees = await exportTable('employees', 'id');
    const empBackupPath = path.join(backupDir, 'backup_employees_406.json');
    fs.writeFileSync(empBackupPath, JSON.stringify(employees, null, 2), 'utf8');
    console.log(`Saved employees backup to: ${empBackupPath}`);

    // 2. Export break_summary
    const breakSummary = await exportTable('break_summary', 'id');
    const breakBackupPath = path.join(backupDir, 'backup_break_summary_24004.json');
    fs.writeFileSync(breakBackupPath, JSON.stringify(breakSummary, null, 2), 'utf8');
    console.log(`Saved break_summary backup to: ${breakBackupPath}`);

    // 3. Export habitual_offenders
    const habitual = await exportTable('habitual_offenders', null);
    const habBackupPath = path.join(backupDir, 'backup_habitual_offenders_193.json');
    fs.writeFileSync(habBackupPath, JSON.stringify(habitual, null, 2), 'utf8');
    console.log(`Saved habitual_offenders backup to: ${habBackupPath}`);

    console.log('\nBackup generation finished successfully!');
}

runBackup().catch(err => {
    console.error('BACKUP FAILED:', err);
    process.exit(1);
});
