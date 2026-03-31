// Auto-detect API URL. If using VS Code Live Server (port 5500), point to Rust backend (port 3000)
const API_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') && window.location.port !== '3000'
    ? 'http://localhost:3000/api'
    : '/api';

const uploadForm = document.getElementById('upload-form');
const csvFileInput = document.getElementById('csv-file');
const mappingYearSelect = document.getElementById('mapping-year');
const btnImport = document.getElementById('btn-import');
const loading = document.getElementById('loading');
const summarySection = document.getElementById('summary-section');
const importedCount = document.getElementById('imported-count');
const taskCount = document.getElementById('task-count');
const leadsBody = document.getElementById('leads-body');
const btnRefresh = document.getElementById('btn-refresh');

// Define exactly what the user provided
const COLUMN_MAPPINGS = {
    '2024': {
        customerId: ["Customer ID", "customerId", "customer_id"],
        displayName: ["Display Name", "displayName", "name", "Name"],
        phone: ["Contact Number", "Phone(WhatsApp Number)", "phone", "Phone", "Phone/WhatsApp"],
        email: ["E-mail", "Email", "e-mail", "E-mail"],
        platform: ["Platform", "Channel"],
        lineUid: ["Line_UID", "Line UID", "line_uid", "lineUID"],
        lineId: ["Line ID", "line_id"],
        country: ["TH_IN_Status", "TH/IN Status", "TH/IN", "Country", "country"],
        source: ["Source"],
        serviceInterest: ["service_interest", "Service Interest", "service"],
        lifecycleStage: ["Lifecycle Stage", "Stage"],
        status: ["Status", "Customer Status"],
        isUQL: ["UQL", "isUQL"],
        isMQL: ["MQL", "isMQL"],
        isSQL: ["SQL", "isSQL"],
        mqlToSqlDays: ["MQL TO SQL", "MQL to SQL", "mql_to_sql_days"],
        assignedSales: ["SALES (AC)", "Sale (AC)", "Sales (AC)", "Sale(AC)", "Sales(AC)", "Sale(CS)", "Sales", "Sale", "CS", "AC", "Assigned Sales", "Sales Name"],
        assignedDoctor: ["Doctor", "assigned_doctor", "Assigned Doctor", "Doctor Name"],
        revenueWeight: ["HN", "hn", "revenue_weight", "HN (for close won case)"],
        closeWonMonth: ["close won month", "Close Won Month"],
        reasonLost: ["Reason lost", "Reason Lost"],
        notes: ["notes", "Note", "วันทำงานของแอดมินไทย"],
        remark: ["remark", "Remark"],
        isInactive: ["Inactive", "isInactive", "Status_Inactive"],
        date: ["Date", "Date_Clean", "createdAt", "date"],
        month: ["Month", "Monrh"], // Handle typo in 2024
        year: ["Year"]
    },
    '2025': {
        customerId: ["Customer_ID", "Customer ID", "customerId", "customer_id"],
        displayName: ["Name", "Display Name", "displayName", "name"],
        phone: ["Phone(WhatsApp Number)", "phone", "Phone", "Phone/WhatsApp"],
        email: ["Email", "e-mail", "E-mail"],
        platform: ["Platform", "Channel"],
        lineUid: ["Line_UID", "Line UID", "line_uid", "lineUID"],
        lineId: ["Line ID", "line_id"],
        country: ["TH_IN_Status", "TH/IN Status", "TH/IN", "Country", "country"],
        source: ["Chanel_Interection(Source)", "Source"],
        serviceInterest: ["Main_Procedure", "service_interest", "Service Interest", "service"],
        lifecycleStage: ["Lifecycle Stage", "Stage"],
        status: ["Status", "Customer Status"],
        isUQL: ["UQL", "isUQL"],
        isMQL: ["MQL", "isMQL"],
        isSQL: ["SQL", "isSQL"],
        mqlToSqlDays: ["MQL to SQL", "MQL TO SQL", "MQL to SQL", "mql_to_sql_days"],
        assignedSales: ["Sale(CS)", "SALES (AC)", "Sale (AC)", "Sales (AC)", "Sale(AC)", "Sales(AC)", "Sale(CS)", "Sales", "Sale", "CS", "AC", "Assigned Sales", "Sales Name"],
        assignedDoctor: ["Doctor", "assigned_doctor", "Assigned Doctor", "Doctor Name"],
        revenueWeight: ["HN (for close won case)", "HN", "hn", "revenue_weight"],
        closeWonMonth: ["close won month", "Close Won Month"],
        reasonLost: ["Reason Lost", "Reason lost", "reason_lost", "ReasonLost"],
        notes: ["วันทำงานของแอดมินไทย", "notes", "Note"],
        remark: ["REMARK", "remark", "Remark"],
        isInactive: ["Inactive", "isInactive"],
        date: ["Date", "createdAt", "date"],
        month: ["Month"],
        year: ["Year"]
    },
    '2026': {
        customerId: ["Customer_ID", "Customer ID", "customerId", "customer_id"],
        displayName: ["Display Name\n(ใช้ตามใน CAAC ได้เลย)", "Display Name (ใช้ตามใน CAAC ได้เลย)", "Display Name", "displayName", "name", "Name", "Display Name (ใช้ใน CAAC ได้เลย)"],
        phone: ["Phone(WhatsApp Number)", "Phone (WhatsApp Number)", "phone", "Phone", "Phone/WhatsApp", "Contact Number"],
        email: ["Gmail", "Email", "e-mail", "E-mail"],
        platform: ["Platform", "Channel"],
        lineUid: ["Line_UID *สำคัญมาก*", "Line_UID สำคัญมาก", "Line_UID", "Line UID", "line_uid", "lineUID", "Line_UID*สำคัญมาก*"],
        lineId: ["Line ID", "line_id"],
        country: ["TH_IN_Status", "TH/IN Status", "TH/IN", "Country", "country"],
        source: ["Source"],
        serviceInterest: ["service_interest", "Service Interest", "service"],
        lifecycleStage: ["lead_cycle", "Lifecycle Stage", "Stage"],
        status: ["Status", "Customer Status"],
        isUQL: ["UQL", "isUQL"],
        isMQL: ["MQL", "isMQL"],
        isSQL: ["SQL", "isSQL"],
        mqlToSqlDays: ["MQL to SQL", "MQL TO SQL", "mql_to_sql_days"],
        assignedSales: ["Sale (CS)", "SALES (AC)", "Sale (AC)", "Sales (AC)", "Sale(AC)", "Sales(AC)", "Sale(CS)", "Sales", "Sale", "CS", "AC", "Assigned Sales", "Sales Name"],
        assignedDoctor: ["Doctor", "assigned_doctor", "Assigned Doctor", "Doctor Name"],
        revenueWeight: ["HN", "hn", "revenue_weight", "HN (for close won case)"],
        closeWonMonth: ["close won month", "Close Won Month"],
        reasonLost: ["Reason Lost", "Reason lost", "reason_lost", "ReasonLost"],
        notes: ["notes", "Note", "วันทำงานของแอดมินไทย"],
        remark: ["remark", "Remark"],
        isInactive: ["Inactive", "isInactive"],
        date: ["Date", "createdAt", "date"],
        month: ["Month"],
        year: ["Year"]
    }
};

const DEFAULT_MAPPING = {
    customerId: ["Customer ID", "customerId", "customer_id", "Customer_ID"],
    displayName: ["Display Name", "displayName", "name", "Name", "Display Name (ใช้ใน CAAC ได้เลย)"],
    phone: ["Phone(WhatsApp Number)", "Contact Number", "phone", "Phone", "Phone/WhatsApp"],
    email: ["Email", "E-mail", "e-mail", "Gmail"],
    platform: ["Platform", "Channel"],
    lineUid: ["Line_UID", "Line UID", "line_uid", "lineUID", "Line_UID *สำคัญมาก*"],
    lineId: ["Line ID", "line_id"],
    country: ["TH_IN_Status", "TH/IN", "Country", "TH/IN Status", "country"],
    source: ["Source", "Chanel_Interection(Source)"],
    serviceInterest: ["service_interest", "Service Interest", "Main_Procedure"],
    lifecycleStage: ["Lifecycle Stage", "Stage", "lead_cycle"],
    status: ["Status", "Customer Status"],
    isUQL: ["UQL", "isUQL"],
    isMQL: ["MQL", "isMQL"],
    isSQL: ["SQL", "isSQL"],
    mqlToSqlDays: ["MQL TO SQL", "MQL to SQL", "mql_to_sql_days"],
    assignedSales: ["SALES (AC)", "Sale (AC)", "Sales (AC)", "Sale(AC)", "Sales(AC)", "Sale(CS)", "Sales", "Sale", "CS", "AC"],
    assignedDoctor: ["Doctor", "assigned_doctor", "Assigned Doctor", "Doctor Name"],
    revenueWeight: ["HN", "hn", "revenue_weight", "HN (for close won case)"],
    closeWonMonth: ["close won month", "Close Won Month"],
    reasonLost: ["Reason Lost", "Reason lost", "reason_lost", "ReasonLost"],
    notes: ["notes", "Note", "วันทำงานของแอดมินไทย"],
    remark: ["remark", "REMARK", "Remark"],
    isInactive: ["isInactive", "Inactive"],
    date: ["Date", "Date_Clean", "createdAt", "date"],
    month: ["Month", "Monrh"],
    year: ["Year"]
};

document.addEventListener('DOMContentLoaded', fetchLeads);
uploadForm.addEventListener('submit', handleUpload);
btnRefresh.addEventListener('click', fetchLeads);

async function handleUpload(e) {
    e.preventDefault();

    if (!csvFileInput.files[0]) {
        showNotification("Please select a CSV file.", "error");
        return;
    }

    const file = csvFileInput.files[0];
    const yearSelection = mappingYearSelect.value;

    toggleLoading(true);
    btnImport.disabled = true;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            console.log("Parsed CSV:", results);
            if (results.errors.length > 0) {
                console.warn("CSV parse errors:", results.errors);
            }

            processData(results.data, yearSelection);
        },
        error: function (err) {
            console.error(err);
            showNotification("Failed to parse CSV file.", "error");
            toggleLoading(false);
            btnImport.disabled = false;
        }
    });
}

function getMapping(year) {
    if (year === 'auto' || !COLUMN_MAPPINGS[year]) {
        return DEFAULT_MAPPING;
    }
    return COLUMN_MAPPINGS[year];
}

function mapRow(row, mappingConfig) {
    const mappedRow = {};
    const rowKeys = Object.keys(row);

    for (const [standardKey, possibleNames] of Object.entries(mappingConfig)) {
        let foundValue = null;

        // Exact match check first
        for (const name of possibleNames) {
            // we check if that column name exists in our row data exactly, or ignoring case/spaces
            // A simple approach: exactly matches header string
            if (row[name] !== undefined && row[name] !== "") {
                foundValue = row[name];
                break;
            }

            // Try trimmed case-insensitive
            const matchingKey = rowKeys.find(k => k.trim().toLowerCase() === name.trim().toLowerCase());
            if (matchingKey && row[matchingKey] !== "") {
                foundValue = row[matchingKey];
                break;
            }
        }

        mappedRow[standardKey] = foundValue ? String(foundValue).trim() : null;
    }

    // Assigning missing years dynamically if not mapped
    if (!mappedRow.year) {
        if (mappingYearSelect.value !== 'auto') {
            mappedRow.year = mappingYearSelect.value;
        }
    }

    return mappedRow;
}

async function processData(csvData, selectedYear) {
    const mappingConfig = getMapping(selectedYear);
    const convertedData = csvData.map(row => mapRow(row, mappingConfig));

    console.log(`Ready to send ${convertedData.length} records...`, convertedData[0]);

    // Send to backend in one batch
    try {
        const response = await fetch(`${API_URL}/leads/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(convertedData)
        });

        if (response.ok) {
            const data = await response.json();
            showNotification(`Import successful: ${data.imported_rows} rows added`, 'success');

            // Show summary
            summarySection.classList.remove('hidden');
            importedCount.innerText = data.imported_rows;

            csvFileInput.value = '';

            // Refresh table
            fetchLeads();
        } else {
            const text = await response.text();
            showNotification(`Import failed: ${text}`, 'error');
        }
    } catch (err) {
        console.error(err);
        showNotification("Error communicating with server.", "error");
    } finally {
        toggleLoading(false);
        btnImport.disabled = false;
    }
}

async function fetchLeads() {
    try {
        const response = await fetch(`${API_URL}/leads`);
        const data = await response.json();
        renderTable(data);
    } catch (err) {
        console.error(err);
        // Only show error if it's not the initial load to prevent flashing warnings
    }
}

function renderTable(leads) {
    leadsBody.innerHTML = '';
    taskCount.innerText = leads.length;

    if (leads.length === 0) {
        leadsBody.innerHTML = `<tr><td colspan="28" style="text-align: center; color: var(--text-dim); padding: 2rem;">No leads found in database.</td></tr>`;
        return;
    }

    leads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${lead.id}</td>
            <td>${lead.customer_id || '-'}</td>
            <td><strong>${lead.display_name || '-'}</strong></td>
            <td>${lead.phone || '-'}</td>
            <td>${lead.email || '-'}</td>
            <td>${lead.platform || '-'}</td>
            <td>${lead.line_uid || '-'}</td>
            <td>${lead.line_id || '-'}</td>
            <td>${lead.country || '-'}</td>
            <td>${lead.source || '-'}</td>
            <td><span class="badge badge-primary">${lead.service_interest || '-'}</span></td>
            <td>${lead.lifecycle_stage || '-'}</td>
            <td><span class="badge badge-secondary">${lead.status || '-'}</span></td>
            <td>${lead.is_uql || '-'}</td>
            <td>${lead.is_mql || '-'}</td>
            <td>${lead.is_sql || '-'}</td>
            <td>${lead.mql_to_sql_days || '-'}</td>
            <td>${lead.assigned_sales || '-'}</td>
            <td>${lead.assigned_doctor || '-'}</td>
            <td>${lead.revenue_weight || '-'}</td>
            <td>${lead.close_won_month || '-'}</td>
            <td>${lead.reason_lost || '-'}</td>
            <td>${lead.notes || '-'}</td>
            <td>${lead.remark || '-'}</td>
            <td>${lead.is_inactive || '-'}</td>
            <td>${lead.date || '-'}</td>
            <td>${lead.month || '-'}</td>
            <td>${lead.year || '-'}</td>
        `;
        leadsBody.appendChild(tr);
    });
}

function toggleLoading(show) {
    if (show) loading.classList.remove('hidden');
    else loading.classList.add('hidden');
}

function showNotification(message, type) {
    const container = document.getElementById('notification-container');
    const note = document.createElement('div');
    note.className = 'notification';
    note.innerText = message;

    Object.assign(note.style, {
        background: type === 'error' ? 'var(--error)' : 'var(--success)',
        color: 'white',
        padding: '1rem 1.5rem',
        borderRadius: '0.75rem',
        marginBottom: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)',
        fontWeight: '600',
        transition: 'opacity 0.3s ease',
        transform: 'translateY(10px)'
    });

    if (!container.style.position) {
        Object.assign(container.style, { position: 'fixed', bottom: '20px', right: '20px', zIndex: '1000' });
    }

    container.appendChild(note);

    // Animate in
    setTimeout(() => { note.style.transform = 'translateY(0)'; }, 10);

    // Animate out
    setTimeout(() => {
        note.style.opacity = '0';
        setTimeout(() => note.remove(), 300);
    }, 4000);
}
