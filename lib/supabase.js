const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://rpfeazjpuxpfhofdrcza.supabase.co',
    'sb_publishable_C-b-Sf1F73AWB4lxD9camA_E0qqYVTv'
);

module.exports = supabase;
