const express =
    require('express');

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

/* ===== NORMALIZE EMP ID ===== */

function normalize(id) {

    return String(id || '')

        .replace(/\s/g, '')

        .replace('TCSEK', '')

        .trim()

        .toUpperCase();
}

/* ===== VALID STATIONS ===== */

const VALID_STATIONS = [
    'ALVA', 'PNCU', 'CPPY', 'AATK', 'MUTT', 'KLMT', 'CCUV',
    'PDPM', 'EDAP', 'CGPP', 'PARV', 'JLSD', 'KALR', 'TNHL',
    'MGRD', 'MACE', 'ERSH', 'KVTR', 'EMKM', 'VYTA', 'TKDM',
    'PETT', 'VAKK', 'SNJN', 'TPHT'
];

/* ===== GET ENTRY ===== */

router.get(
'/api/edit-entry/:id',
isAuthenticated,
async (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({});
    }

    /* ===== FETCH ENTRY ===== */
    const { data, error } = await supabase
        .from('break_summary')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !data) {
        console.log('EDIT FETCH ERROR:', error);
        return res.status(404).json({});
    }

    /* ===== FETCH EMPLOYEE ===== */
    const employees = await getEmployees();
    const found = employees.find(emp =>
        normalize(emp.emp_id) === normalize(data.emp_id)
    );

    data.name = found?.name || '';
    res.json(data);
});

/* ===== SAVE EDIT ===== */

router.post(
'/api/edit-entry/:id',
isAuthenticated,
async (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid entry ID'
        });
    }

    /* ===== FETCH EXISTING RECORD FIRST ===== */
    const { data: existingRow, error: fetchError } = await supabase
        .from('break_summary')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !existingRow) {
        return res.status(404).json({
            success: false,
            message: 'Break entry not found'
        });
    }

    /* ===== BODY EXTRACTION ===== */
    const {
        emp_id,
        station,
        shift_type,
        break1,
        break2,
        break3,
        break4,
        break5,
        break6,
        edited_by_name,
        edited_by_emp,
        edit_reason
    } = req.body;

    /* ===== 1. EMPLOYEE ID VALIDATION ===== */
    const rawEmpId = String(emp_id !== undefined && emp_id !== null ? emp_id : '').trim();
    if (!rawEmpId) {
        return res.status(400).json({
            success: false,
            message: 'Employee ID is required'
        });
    }

    const normalizedEmpId = normalize(rawEmpId);
    if (!normalizedEmpId || normalizedEmpId === '0' || normalizedEmpId === 'NULL' || normalizedEmpId === 'UNDEFINED') {
        return res.status(400).json({
            success: false,
            message: 'Invalid Employee ID: Cannot be 0, empty, or undefined'
        });
    }

    const employees = await getEmployees();
    let validEmp = employees?.find(emp => normalize(emp.emp_id) === normalizedEmpId);

    // DB fallback in case of recently added employee not in cache
    if (!validEmp) {
        const { data: dbEmp } = await supabase
            .from('employees')
            .select('*')
            .or(`emp_id.eq.${normalizedEmpId},emp_id.eq.TCSEK ${normalizedEmpId}`)
            .limit(1);

        if (dbEmp && dbEmp.length > 0) {
            validEmp = dbEmp[0];
        }
    }

    if (!validEmp) {
        return res.status(400).json({
            success: false,
            message: `Employee ID "${normalizedEmpId}" does not exist in employee roster`
        });
    }

    /* ===== 2. STATION VALIDATION ===== */
    const stationCode = String(station || '').trim().toUpperCase();
    if (!stationCode || !VALID_STATIONS.includes(stationCode)) {
        return res.status(400).json({
            success: false,
            message: 'Please select a valid KMRL station from the list'
        });
    }

    /* ===== 3. SHIFT TYPE ===== */
    const validShiftType = (shift_type === 'DOUBLE') ? 'DOUBLE' : 'NORMAL';

    /* ===== 4. BREAK VALUES & RUNNING BREAK VALIDATION ===== */
    const rawBreaks = [break1, break2, break3, break4, break5, break6];
    const validatedBreaks = [];

    for (let i = 0; i < 6; i++) {
        const col = `break${i + 1}`;
        const rawVal = rawBreaks[i];
        const numVal = Number(rawVal === undefined || rawVal === '' || rawVal === null ? 0 : rawVal);

        if (isNaN(numVal) || !Number.isInteger(numVal)) {
            return res.status(400).json({
                success: false,
                message: `Break ${i + 1} must be a valid whole number`
            });
        }

        if (numVal < 0) {
            // Preserve -1 only if this break was ALREADY -1 (running break) in the database
            if (numVal === -1 && Number(existingRow[col]) === -1) {
                validatedBreaks.push(-1);
            } else {
                return res.status(400).json({
                    success: false,
                    message: `Break ${i + 1} cannot be a negative value`
                });
            }
        } else {
            validatedBreaks.push(numVal);
        }
    }

    const [b1, b2, b3, b4, b5, b6] = validatedBreaks;

    /* ===== 5. TOTAL CALCULATION ===== */
    const total =
        Math.max(0, b1) +
        Math.max(0, b2) +
        Math.max(0, b3) +
        Math.max(0, b4) +
        Math.max(0, b5) +
        Math.max(0, b6);

    /* ===== 6. RUNNING STATUS & START TIME ===== */
    let current_open_break = null;
    if (b1 < 0) current_open_break = 'Break 1';
    else if (b2 < 0) current_open_break = 'Break 2';
    else if (b3 < 0) current_open_break = 'Break 3';
    else if (b4 < 0) current_open_break = 'Break 4';
    else if (b5 < 0) current_open_break = 'Break 5';
    else if (b6 < 0) current_open_break = 'Break 6';

    const current_start_time = current_open_break ? existingRow.current_start_time : null;

    /* ===== 7. AUDIT FIELDS VALIDATION ===== */
    const editedByName = String(edited_by_name || '').trim();
    const editedByEmp = String(edited_by_emp || '').trim();
    const editReason = String(edit_reason || '').trim();

    if (!editedByName) {
        return res.status(400).json({
            success: false,
            message: 'Edited By Name is required for audit traceability'
        });
    }

    if (!editedByEmp) {
        return res.status(400).json({
            success: false,
            message: 'Edited By Employee ID is required for audit traceability'
        });
    }

    if (!editReason) {
        return res.status(400).json({
            success: false,
            message: 'Edit Reason is required for audit traceability'
        });
    }

    /* ===== 8. DATABASE UPDATE ===== */
    const { error: updateError } = await supabase
        .from('break_summary')
        .update({
            emp_id: normalizedEmpId,
            station: stationCode,
            shift_type: validShiftType,
            break1: b1,
            break2: b2,
            break3: b3,
            break4: b4,
            break5: b5,
            break6: b6,
            total,
            current_open_break,
            current_start_time,
            edited_by_name: editedByName,
            edited_by_emp: editedByEmp,
            edit_reason: editReason,
            edited_at: new Date().toISOString()
        })
        .eq('id', id);

    if (updateError) {
        console.error('EDIT UPDATE ERROR:', updateError);
        return res.status(500).json({
            success: false,
            message: 'Database update failed: ' + updateError.message
        });
    }

    /* ===== SUCCESS ===== */
    res.json({
        success: true
    });
});

/* ===== EXPORT ===== */

module.exports =
    router;

