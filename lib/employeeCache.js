const supabase = require('./supabase');

let cachedEmployees = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

async function getEmployees() {
    const now = Date.now();
    
    // Check if cache is empty or expired
    if (!cachedEmployees || now - lastFetchTime > CACHE_DURATION_MS) {
        console.log('Fetching employees from Supabase to update cache...');
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*');
            
        if (error) {
            console.error('Error fetching employees for cache:', error);
            // On error, if we have a stale cache, return it. Otherwise return empty array.
            if (!cachedEmployees) return [];
        } else {
            cachedEmployees = employees;
            lastFetchTime = now;
        }
    }
    
    return cachedEmployees || [];
}

module.exports = {
    getEmployees
};
