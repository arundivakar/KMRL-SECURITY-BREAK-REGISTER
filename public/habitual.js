let currentPage = 1;
const limit = 50;

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/* =========================================================
   TAB SWITCHING
   ========================================================= */
function switchTab(tab) {
    const tabCurrentBtn = document.getElementById('tabCurrent');
    const tabHistoryBtn = document.getElementById('tabHistory');
    const currentContainer = document.getElementById('tab-current-container');
    const historyContainer = document.getElementById('tab-history-container');

    if (tab === 'current') {
        tabCurrentBtn.classList.add('active');
        tabHistoryBtn.classList.remove('active');
        currentContainer.style.display = 'block';
        historyContainer.style.display = 'none';
    } else {
        tabHistoryBtn.classList.add('active');
        tabCurrentBtn.classList.remove('active');
        currentContainer.style.display = 'none';
        historyContainer.style.display = 'block';

        const historyInput = document.getElementById('historySearchInput');
        if (historyInput) {
            historyInput.focus();
        }
    }
}

/* =========================================================
   TAB 1: CURRENT CONTRACT HABITUAL OFFENDERS
   ========================================================= */
async function loadHabitual() {
    try {
        const response = await fetch(`/api/habitual-offenders?page=${currentPage}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch habitual offenders: ${response.statusText}`);
        }
        const logs = await response.json();

        const body = document.getElementById('logs-body');
        body.innerHTML = '';

        const searchValue = document.getElementById('searchInput')
            .value
            .trim()
            .toUpperCase();

        const filtered = searchValue
            ? logs.rows.filter(log => String(log.emp_id).toUpperCase().includes(searchValue))
            : logs.rows;

        if (filtered.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align:center; padding:24px; color:#64748b;">
                        No current habitual offender records found.
                    </td>
                </tr>
            `;
            document.getElementById('page-info').innerText = `Page ${currentPage} of ${logs.totalPages || 1}`;
            return;
        }

        filtered.forEach(log => {
            const formattedDate = log.latest_date
                ? log.latest_date.split('-').reverse().join('/')
                : '-';

            const cleanEmpId = escapeHtml(log.emp_id);
            const cleanName = escapeHtml(log.name || '');

            body.innerHTML += `
            <tr style="background:#ffcccc;">
                <td style="font-weight:600;">${cleanEmpId}</td>
                <td>${cleanName}</td>
                <td>
                    <b style="color:#b91c1c; font-size:15px;">
                        ${log.total_violations || 0}
                    </b>
                </td>
                <td>${formattedDate}</td>
                <td>${escapeHtml(log.latest_station || '-')}</td>
                <td>
                    <button 
                        class="history-btn" 
                        onclick="openHistoryModal('${cleanEmpId}')"
                        title="View cross-contract history for ${cleanName || cleanEmpId}"
                    >
                        View History
                    </button>
                </td>
            </tr>
            `;
        });

        document.getElementById('page-info').innerText = `Page ${currentPage} of ${logs.totalPages || 1}`;
    } catch (err) {
        console.error('Error loading habitual offenders:', err);
    }
}

function nextPage() {
    const pageText = document.getElementById('page-info').innerText;
    const totalPages = Number(pageText.split('of')[1] || 1);

    if (currentPage < totalPages) {
        currentPage++;
        loadHabitual();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadHabitual();
    }
}

/* =========================================================
   TAB 2: CROSS-CONTRACT EMPLOYEE HISTORY SEARCH
   ========================================================= */
async function searchHistory() {
    const input = document.getElementById('historySearchInput');
    const query = input.value.trim();
    const resultsContainer = document.getElementById('history-results');

    if (!query) {
        resultsContainer.innerHTML = `
            <div style="padding:30px; text-align:center; color:#94a3b8; font-size:14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:10px;">
                Please enter an Employee Name, Current ID, or Previous ID to search.
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = `
        <div style="padding:40px; text-align:center; color:#64748b; font-size:15px;">
            ⏳ Searching historical and current records for <b>"${escapeHtml(query)}"</b>...
        </div>
    `;

    try {
        const response = await fetch(`/api/habitual-offenders/history?search=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error(`Search request failed with status: ${response.status}`);
        }
        const data = await response.json();

        if (!data.profiles || data.profiles.length === 0) {
            resultsContainer.innerHTML = `
                <div style="padding:30px; text-align:center; color:#64748b; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                    <div style="font-size:18px; font-weight:700; margin-bottom:8px; color:#334155;">No Records Found</div>
                    <div>No current or previous contract records matched <b>"${escapeHtml(query)}"</b>.</div>
                </div>
            `;
            return;
        }

        let html = `
            <div style="margin-bottom:16px; font-size:14px; color:#475569; font-weight:600;">
                Found ${data.profiles.length} matching employee record(s):
            </div>
        `;

        data.profiles.forEach(profile => {
            html += renderProfileCard(profile);
        });

        resultsContainer.innerHTML = html;
    } catch (err) {
        console.error('Error searching history:', err);
        resultsContainer.innerHTML = `
            <div style="padding:20px; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
                Failed to load history search results. Please try again.
            </div>
        `;
    }
}

function renderProfileCard(profile) {
    const isDup = profile.hasDuplicates;
    const warningHtml = isDup ? `
        <div class="warning-pill">
            <span>⚠️</span>
            <div>
                <b>Multiple employee records exist for this name.</b>
                <span style="font-weight:400; display:block; font-size:12px; margin-top:2px;">
                    Records across IDs are listed separately below. Verify the exact Employee ID for the individual.
                </span>
            </div>
        </div>
    ` : '';

    // Current Contract Items
    let currentRowsHtml = '';
    if (profile.currentEmployees && profile.currentEmployees.length > 0) {
        currentRowsHtml = profile.currentEmployees.map(ce => `
            <div class="history-stat-grid" style="margin-bottom:8px;">
                <div class="history-stat-item">
                    <div class="history-stat-label">Current Emp ID</div>
                    <div class="history-stat-val" style="color:#007F8C;">${escapeHtml(ce.emp_id)}</div>
                </div>
                <div class="history-stat-item">
                    <div class="history-stat-label">Exceeded Count</div>
                    <div class="history-stat-val" style="color:${ce.total_violations > 0 ? '#dc2626' : '#16a34a'};">
                        ${ce.total_violations}
                    </div>
                </div>
                <div class="history-stat-item">
                    <div class="history-stat-label">Latest Date</div>
                    <div class="history-stat-val" style="font-size:14px;">${escapeHtml(ce.latest_date || '-')}</div>
                </div>
                <div class="history-stat-item">
                    <div class="history-stat-label">Latest Station</div>
                    <div class="history-stat-val" style="font-size:14px;">${escapeHtml(ce.latest_station || '-')}</div>
                </div>
            </div>
        `).join('');
    } else {
        currentRowsHtml = `
            <div style="font-size:13px; color:#94a3b8; font-style:italic; padding:6px 0;">
                No active employee record in current contract.
            </div>
        `;
    }

    // Previous Contract Items
    let previousRowsHtml = '';
    if (profile.previousEmployees && profile.previousEmployees.length > 0) {
        previousRowsHtml = profile.previousEmployees.map(pe => `
            <div class="history-stat-grid" style="margin-bottom:8px;">
                <div class="history-stat-item">
                    <div class="history-stat-label">Previous Emp ID</div>
                    <div class="history-stat-val" style="color:#b45309;">${escapeHtml(pe.emp_id)}</div>
                </div>
                <div class="history-stat-item">
                    <div class="history-stat-label">Exceeded Count</div>
                    <div class="history-stat-val" style="color:${pe.total_violations > 0 ? '#dc2626' : '#16a34a'};">
                        ${pe.total_violations}
                    </div>
                </div>
                <div class="history-stat-item">
                    <div class="history-stat-label">Latest Date</div>
                    <div class="history-stat-val" style="font-size:14px;">${escapeHtml(pe.latest_date || '-')}</div>
                </div>
                <div class="history-stat-item">
                    <div class="history-stat-label">Latest Station</div>
                    <div class="history-stat-val" style="font-size:14px;">${escapeHtml(pe.latest_station || '-')}</div>
                </div>
            </div>
        `).join('');
    } else {
        previousRowsHtml = `
            <div style="font-size:13px; color:#94a3b8; font-style:italic; padding:6px 0;">
                No previous contract history recorded.
            </div>
        `;
    }

    return `
    <div class="result-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
            <div>
                <h3 style="margin:0 0 4px 0; color:#0f172a; font-size:18px;">
                    ${escapeHtml(profile.name)}
                </h3>
                <div style="font-size:12px; color:#64748b;">
                    Security Guard / Officer
                </div>
            </div>
            <button 
                class="history-btn" 
                onclick="openHistoryModal('${escapeHtml(profile.name)}')"
                style="padding:8px 16px; font-size:13px;"
            >
                View Full Detail
            </button>
        </div>

        ${warningHtml}

        <!-- CURRENT CONTRACT SECTION -->
        <div class="history-section-box">
            <div class="history-section-title">
                <span>Current Contract</span>
                <span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px;">Active</span>
            </div>
            ${currentRowsHtml}
        </div>

        <!-- PREVIOUS CONTRACT SECTION -->
        <div class="history-section-box">
            <div class="history-section-title">
                <span style="color:#b45309;">Previous Contract History</span>
                <span style="font-size:11px; background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px;">Archived</span>
            </div>
            ${previousRowsHtml}
        </div>

        <!-- COMBINED SUMMARY SECTION -->
        <div class="history-summary-box">
            <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#166534; margin-bottom:10px;">
                Combined Historical Summary
            </div>
            <div style="display:flex; gap:20px; flex-wrap:wrap;">
                <div>
                    <span style="font-size:12px; color:#475569;">Current Contract:</span>
                    <b style="font-size:15px; margin-left:6px; color:#0f172a;">${profile.summary.currentViolations}</b>
                </div>
                <div>
                    <span style="font-size:12px; color:#475569;">Previous Contracts:</span>
                    <b style="font-size:15px; margin-left:6px; color:#0f172a;">${profile.summary.previousViolations}</b>
                </div>
                <div style="border-left:2px solid #86efac; padding-left:16px;">
                    <span style="font-size:12px; color:#166534; font-weight:700;">All Recorded History:</span>
                    <b style="font-size:17px; margin-left:6px; color:#15803d;">${profile.summary.allRecordedViolations}</b>
                </div>
            </div>
        </div>
    </div>
    `;
}

/* =========================================================
   DETAIL MODAL LOGIC
   ========================================================= */
async function openHistoryModal(searchTerm) {
    const modal = document.getElementById('history-modal');
    const content = document.getElementById('modal-content-body');
    modal.style.display = 'flex';

    content.innerHTML = `
        <div style="padding:40px; text-align:center; color:#64748b; font-size:15px;">
            ⏳ Fetching employee cross-contract history for <b>"${escapeHtml(searchTerm)}"</b>...
        </div>
    `;

    try {
        const response = await fetch(`/api/habitual-offenders/history?search=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error(`Failed to load history details: ${response.status}`);
        }
        const data = await response.json();

        if (!data.profiles || data.profiles.length === 0) {
            content.innerHTML = `
                <div style="text-align:center; padding:30px 10px;">
                    <div style="font-size:18px; font-weight:700; color:#1e293b; margin-bottom:8px;">No History Found</div>
                    <div style="color:#64748b; font-size:14px;">No historical records matched "${escapeHtml(searchTerm)}".</div>
                    <button onclick="closeHistoryModal()" style="margin-top:20px; padding:8px 20px;">Close</button>
                </div>
            `;
            return;
        }

        // Render each profile matching the search
        let modalHtml = '';

        data.profiles.forEach(p => {
            const hasDup = p.hasDuplicates;
            const dupWarning = hasDup ? `
                <div class="warning-pill">
                    <span>⚠️</span>
                    <div>
                        <b>Multiple Employee IDs Detected:</b>
                        <div style="font-size:12px; font-weight:normal; margin-top:2px;">
                            More than one employee record shares the name "${escapeHtml(p.name)}". Each ID record is presented separately below to ensure correct identification.
                        </div>
                    </div>
                </div>
            ` : '';

            // Current contract items
            let currentItemsHtml = '';
            if (p.currentEmployees && p.currentEmployees.length > 0) {
                currentItemsHtml = p.currentEmployees.map(ce => `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="font-weight:700; font-size:14px; color:#0f172a;">
                                Current Employee ID: <span style="color:#007F8C;">${escapeHtml(ce.emp_id)}</span>
                            </span>
                            <span style="font-size:12px; color:#64748b;">${escapeHtml(ce.designation || 'Security Guard')}</span>
                        </div>
                        <div class="history-stat-grid">
                            <div class="history-stat-item">
                                <div class="history-stat-label">Exceeded Count</div>
                                <div class="history-stat-val" style="color:${ce.total_violations > 0 ? '#dc2626' : '#16a34a'};">
                                    ${ce.total_violations}
                                </div>
                            </div>
                            <div class="history-stat-item">
                                <div class="history-stat-label">Latest Date</div>
                                <div class="history-stat-val" style="font-size:13px;">${escapeHtml(ce.latest_date || '-')}</div>
                            </div>
                            <div class="history-stat-item">
                                <div class="history-stat-label">Latest Station</div>
                                <div class="history-stat-val" style="font-size:13px;">${escapeHtml(ce.latest_station || '-')}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                currentItemsHtml = `
                    <div style="font-size:13px; color:#94a3b8; font-style:italic; padding:8px;">
                        No record found in current contract.
                    </div>
                `;
            }

            // Previous contract items
            let previousItemsHtml = '';
            if (p.previousEmployees && p.previousEmployees.length > 0) {
                previousItemsHtml = p.previousEmployees.map(pe => `
                    <div style="background:white; border:1px solid #e2e8f0; border-radius:8px; padding:12px 14px; margin-bottom:8px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                            <span style="font-weight:700; font-size:14px; color:#0f172a;">
                                Previous Employee ID: <span style="color:#b45309;">${escapeHtml(pe.emp_id)}</span>
                            </span>
                            <span style="font-size:12px; color:#64748b;">${escapeHtml(pe.designation || 'Security Guard')}</span>
                        </div>
                        <div class="history-stat-grid">
                            <div class="history-stat-item">
                                <div class="history-stat-label">Exceeded Count</div>
                                <div class="history-stat-val" style="color:${pe.total_violations > 0 ? '#dc2626' : '#16a34a'};">
                                    ${pe.total_violations}
                                </div>
                            </div>
                            <div class="history-stat-item">
                                <div class="history-stat-label">Latest Date</div>
                                <div class="history-stat-val" style="font-size:13px;">${escapeHtml(pe.latest_date || '-')}</div>
                            </div>
                            <div class="history-stat-item">
                                <div class="history-stat-label">Latest Station</div>
                                <div class="history-stat-val" style="font-size:13px;">${escapeHtml(pe.latest_station || '-')}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                previousItemsHtml = `
                    <div style="font-size:13px; color:#94a3b8; font-style:italic; padding:8px;">
                        No previous contract records found.
                    </div>
                `;
            }

            modalHtml += `
                <div style="margin-bottom:28px;">
                    <div style="border-bottom:2px solid #e2e8f0; padding-bottom:12px; margin-bottom:16px;">
                        <div style="font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:700; color:#64748b;">
                            Employee History Profile
                        </div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a; margin-top:2px;">
                            ${escapeHtml(p.name)}
                        </div>
                    </div>

                    ${dupWarning}

                    <!-- Current Contract -->
                    <div class="history-section-box">
                        <div class="history-section-title">
                            <span>Current Contract</span>
                            <span style="font-size:11px; background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px;">Active</span>
                        </div>
                        ${currentItemsHtml}
                    </div>

                    <!-- Previous Contract -->
                    <div class="history-section-box">
                        <div class="history-section-title">
                            <span style="color:#b45309;">Previous Contract History</span>
                            <span style="font-size:11px; background:#fef3c7; color:#92400e; padding:2px 8px; border-radius:4px;">Archived</span>
                        </div>
                        ${previousItemsHtml}
                    </div>

                    <!-- Combined Historical Summary -->
                    <div class="history-summary-box">
                        <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#166534; margin-bottom:12px;">
                            Combined Historical Summary
                        </div>
                        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; text-align:center;">
                            <div style="background:white; padding:12px 8px; border-radius:8px; border:1px solid #bbf7d0;">
                                <div style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Current Contract</div>
                                <div style="font-size:20px; font-weight:800; color:#0f172a; margin-top:4px;">
                                    ${p.summary.currentViolations}
                                </div>
                            </div>
                            <div style="background:white; padding:12px 8px; border-radius:8px; border:1px solid #bbf7d0;">
                                <div style="font-size:11px; color:#64748b; font-weight:600; text-transform:uppercase;">Previous Contracts</div>
                                <div style="font-size:20px; font-weight:800; color:#0f172a; margin-top:4px;">
                                    ${p.summary.previousViolations}
                                </div>
                            </div>
                            <div style="background:white; padding:12px 8px; border-radius:8px; border:2px solid #16a34a;">
                                <div style="font-size:11px; color:#166534; font-weight:700; text-transform:uppercase;">All Recorded History</div>
                                <div style="font-size:22px; font-weight:900; color:#15803d; margin-top:2px;">
                                    ${p.summary.allRecordedViolations}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        content.innerHTML = modalHtml;
    } catch (err) {
        console.error('Error opening history modal:', err);
        content.innerHTML = `
            <div style="padding:20px; color:#b91c1c; background:#fef2f2; border:1px solid #fecaca; border-radius:8px;">
                Failed to load employee history. Please close and try again.
            </div>
        `;
    }
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleModalBackdropClick(event) {
    if (event.target === document.getElementById('history-modal')) {
        closeHistoryModal();
    }
}

// Close on Escape key press
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeHistoryModal();
    }
});

// Initialize on page load
loadHabitual();
