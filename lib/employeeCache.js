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

let cachedArchivedEmployees = null;
let lastArchivedFetchTime = 0;
const ARCHIVE_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour (archive is static)

async function getArchivedEmployees() {
    const now = Date.now();
    if (!cachedArchivedEmployees || now - lastArchivedFetchTime > ARCHIVE_CACHE_DURATION_MS) {
        const { data: employees, error } = await supabase
            .from('archive_employees')
            .select('*');
            
        if (error) {
            console.error('Error fetching archived employees for cache:', error);
            if (!cachedArchivedEmployees) return [];
        } else {
            cachedArchivedEmployees = employees;
            lastArchivedFetchTime = now;
        }
    }
    return cachedArchivedEmployees || [];
}

function clearCache() {
    cachedEmployees = null;
    lastFetchTime = 0;
    cachedArchivedEmployees = null;
    lastArchivedFetchTime = 0;
    console.log('Employee cache cleared manually.');
}

module.exports = {
    getEmployees,
    getArchivedEmployees,
    clearCache
};

