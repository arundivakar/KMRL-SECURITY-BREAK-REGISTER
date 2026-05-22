const supabase = require('./lib/supabase');

async function insertTest() {

    const { data, error } = await supabase
        .from('break_summary')
        .insert([
            {
                entry_date: new Date().toISOString().split('T')[0],

                emp_id: 'EMP001',

                station: 'TEST STATION',

                shift_type: 'A',

                break1: 10,

                total: 10
            }
        ]);

    if (error) {
        console.log('ERROR:', error);
    } else {
        console.log('INSERT SUCCESS');
        console.log(data);
    }
}

insertTest();
