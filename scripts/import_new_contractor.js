/**
 * KMRL Security Break Register - New Contractor Employee Master Import
 * Imports the 274 employees from "KMRL SECURITY UPDATED.csv" into the employees table.
 */

const fs = require('fs');
const path = require('path');
const projectDir = path.resolve(__dirname, '..');
const { createClient } = require(path.join(projectDir, 'node_modules/@supabase/supabase-js'));
require(path.join(projectDir, 'node_modules/dotenv')).config({ path: path.join(projectDir, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const { clearCache } = require(path.join(projectDir, 'lib/employeeCache'));

async function importNewContractor() {
    console.log('================================================================');
    console.log('KMRL SECURITY BREAK REGISTER — NEW CONTRACTOR EMPLOYEE IMPORT');
    console.log('================================================================\n');

    // 1. Clean any partial rows from employees
    console.log('Clearing any partial rows from employees table...');
    const { error: delErr } = await supabase.from('employees').delete().gte('id', 0);
    if (delErr) {
        console.error('Delete error (trying neq):', delErr.message);
        await supabase.from('employees').delete().neq('emp_id', 'NON_EXISTENT');
    }

    const { count: preCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });
    console.log(`Current employees count in table before import: ${preCount}`);

    // 2. Read and parse CSV
    const csvPath = path.join(projectDir, 'KMRL SECURITY UPDATED.csv');
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
    console.log(`Read ${lines.length} lines from ${csvPath}`);

    const header = lines[0].split(',').map(s => s.trim());
    console.log('CSV Header:', header);

    const validDesignations = new Set(['Ex.Ser', 'SS', 'SG', 'LSG']);
    const records = [];
    const empIdSet = new Set();

    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        if (parts.length < 4) {
            throw new Error(`Line ${i + 1} has insufficient columns: "${lines[i]}"`);
        }
        const name = parts[1];
        const desg = parts[2];
        const emp_id = parts[3];

        if (!name) throw new Error(`Line ${i + 1} is missing NAME`);
        if (!emp_id) throw new Error(`Line ${i + 1} is missing EMP ID`);
        if (!emp_id.startsWith('TCSEK 9')) {
            throw new Error(`Line ${i + 1} has unexpected employee ID format: "${emp_id}" (expected TCSEK 9xxx)`);
        }
        if (!validDesignations.has(desg)) {
            throw new Error(`Line ${i + 1} has invalid designation: "${desg}"`);
        }
        if (empIdSet.has(emp_id)) {
            throw new Error(`Line ${i + 1} has duplicate EMP ID: "${emp_id}"`);
        }
        empIdSet.add(emp_id);

        records.push({
            id: i, // Sequential 1 to 274 (cleans contractor typo 'B12' on line 242)
            emp_id: emp_id,
            name: name,
            designation: desg
        });
    }

    console.log(`Validated ${records.length} records from CSV. 0 errors, 0 duplicates.`);
    if (records.length !== 274) {
        throw new Error(`Expected exactly 274 records, found ${records.length}!`);
    }

    // 3. Batch insert into employees
    console.log('\nInserting 274 employees into employees table...');
    const batchSize = 100;
    for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error: insErr } = await supabase.from('employees').insert(batch);
        if (insErr) {
            throw new Error(`Batch insert failed at record ${i + 1}: ${insErr.message}`);
        }
        console.log(`  Inserted records ${i + 1} to ${Math.min(i + batchSize, records.length)}`);
    }

    // 4. Invalidate application cache
    clearCache();
    console.log('\nFlushed in-memory employee cache.');

    // 5. Verify database count
    const { count: finalCount, error: countErr } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;
    console.log(`\nFinal employees count in database: ${finalCount}`);
    if (finalCount === 274) {
        console.log('SUCCESS: Exactly 274 new contractor employees imported and verified!');
    } else {
        throw new Error(`COUNT MISMATCH: Expected 274 employees, but found ${finalCount}!`);
    }

    console.log('================================================================');
    console.log('NEW CONTRACTOR IMPORT COMPLETED (100% OK)');
    console.log('================================================================');
}

if (require.main === module) {
    importNewContractor().catch(err => {
        console.error('IMPORT FAILED:', err);
        process.exit(1);
    });
}

module.exports = { importNewContractor };
