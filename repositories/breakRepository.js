const supabase = require('../lib/supabase');

async function insertBreak(data) {

    const { error } = await supabase
        .from('break_summary')
        .insert([data]);

    if (error) {
        throw error;
    }

    return true;
}

module.exports = {
    insertBreak
};
