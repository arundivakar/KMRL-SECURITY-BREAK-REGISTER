let currentPage = 1;
let archiveFilter = '';

/* ===== CUSTOM FLOATING TOOLTIP ===== */
const tooltipElem = document.createElement('div');
tooltipElem.className = 'floating-tooltip';
document.body.appendChild(tooltipElem);

window.showTooltip = function(e, text) {
    if(!text) return;
    tooltipElem.innerText = text;
    tooltipElem.style.opacity = '1';
    tooltipElem.style.visibility = 'visible';
    tooltipElem.style.left = e.pageX + 'px';
    tooltipElem.style.top = (e.pageY - 40) + 'px';
};

window.hideTooltip = function() {
    tooltipElem.style.opacity = '0';
    tooltipElem.style.visibility = 'hidden';
};

/* ===== LOAD ARCHIVE STATS ===== */
async function loadArchiveStats() {
    try {
        const res = await fetch('/api/archive/stats');
        const data = await res.json();
        if (data) {
            document.getElementById('totalArchivedLogs').innerText = Number(data.totalBreaks || 0).toLocaleString();
            document.getElementById('totalArchivedGuards').innerText = Number(data.totalGuards || 0).toLocaleString();
            document.getElementById('totalArchivedExceeded').innerText = Number(data.totalExceeded || 0).toLocaleString();
        }
    } catch (e) {
        console.error('Error loading archive stats:', e);
    }
}

/* ===== LOAD ARCHIVE LOGS ===== */
async function loadArchiveLogs() {
    const station = document.getElementById('stationFilter')?.value || '';
    const search = document.getElementById('searchInput')?.value || '';
    const dateFrom = document.getElementById('dateFrom')?.value || '';
    const dateTo = document.getElementById('dateTo')?.value || '';

    const tbody = document.getElementById('archive-logs-body');
    tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:25px; color:#64748b;">Loading records...</td></tr>';

    try {
        const url = `/api/archive/logs?page=${currentPage}&station=${encodeURIComponent(station)}&search=${encodeURIComponent(search)}&dateFrom=${encodeURIComponent(dateFrom)}&dateTo=${encodeURIComponent(dateTo)}&filter=${encodeURIComponent(archiveFilter)}`;
        const res = await fetch(url);
        const data = await res.json();

        tbody.innerHTML = '';
        const rows = data.rows || [];

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:35px; color:#64748b; font-weight:500;">No archived records match the selected filters.</td></tr>';
            document.getElementById('page-info').innerText = 'Page 1 of 1';
            return;
        }

        const getTooltip = (logs, breakKey) => {
            if (!logs || (!logs[`${breakKey}_start`] && !logs[`${breakKey}_end`])) return '';
            const text = `Start: ${logs[`${breakKey}_start`] || 'N/A'}  |  End: ${logs[`${breakKey}_end`] || 'N/A'}`;
            return `onmousemove="showTooltip(event, '${text}')" onmouseleave="hideTooltip()"`;
        };

        for (const row of rows) {
            const tr = document.createElement('tr');
            const isExceeded = Number(row.total || 0) > 40;
            if (isExceeded) tr.classList.add('break-exceeded');

            const statusHTML = isExceeded
                ? '<span class="status-danger">EXCEEDED</span>'
                : '<span class="status-normal">NORMAL</span>';

            const formattedDate = row.entry_date
                ? row.entry_date.split('-').reverse().join('/')
                : '';

            tr.innerHTML = `
                <td>${formattedDate}</td>
                <td><strong>${row.emp_id || ''}</strong></td>
                <td>${row.name || ''}</td>
                <td>${row.station || ''}</td>
                <td>${row.shift_type || ''}</td>
                <td>${row.shift_session || ''}</td>
                <td ${getTooltip(row.break_logs, 'break1')}>${Math.max(0, row.break1 || 0)}</td>
                <td ${getTooltip(row.break_logs, 'break2')}>${Math.max(0, row.break2 || 0)}</td>
                <td ${getTooltip(row.break_logs, 'break3')}>${Math.max(0, row.break3 || 0)}</td>
                <td ${getTooltip(row.break_logs, 'break4')}>${Math.max(0, row.break4 || 0)}</td>
                <td ${getTooltip(row.break_logs, 'break5')}>${Math.max(0, row.break5 || 0)}</td>
                <td ${getTooltip(row.break_logs, 'break6')}>${Math.max(0, row.break6 || 0)}</td>
                <td><strong>${row.total || 0}</strong></td>
                <td>${statusHTML}</td>
            `;
            tbody.appendChild(tr);
        }

        document.getElementById('page-info').innerText = `Page ${currentPage} of ${data.totalPages || 1}`;
        document.getElementById('prevBtn').disabled = currentPage <= 1;
        document.getElementById('nextBtn').disabled = currentPage >= (data.totalPages || 1);
        document.getElementById('recordCountInfo').innerText = `Total ${Number(data.totalLogs || 0).toLocaleString()} records found`;
    } catch (e) {
        console.error('Error fetching archive logs:', e);
        tbody.innerHTML = '<tr><td colspan="14" style="text-align:center; padding:25px; color:#dc2626;">Failed to load archive data. Check connection.</td></tr>';
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadArchiveLogs();
    }
}

function nextPage() {
    currentPage++;
    loadArchiveLogs();
}

function toggleExceededFilter() {
    archiveFilter = archiveFilter === 'exceeded' ? '' : 'exceeded';
    currentPage = 1;
    loadArchiveLogs();
}

function resetFilters() {
    document.getElementById('stationFilter').value = '';
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    archiveFilter = '';
    currentPage = 1;
    loadArchiveLogs();
}

// Initial load
loadArchiveStats();
loadArchiveLogs();
