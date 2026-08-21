const initialReports = [
    {
        id: "#ADM-1001",
        location: "📍 MG Road, Sector 4 (Lat 12.97341, Lng 77.59218)",
        lat: 12.97341,
        lng: 77.59218,
        problem: "Severe Pothole",
        stateText: "🔴 CRITICAL HAZARD - Structural Sub-Base Crater & Rim Impact Danger",
        severity: "High",
        water: "Yes",
        score: 96,
        sla: "12 Hours",
        healthIndex: 18,
        dimensions: "1.15 m² (Depth: ~12cm)",
        status: "Open"
    }
];

let reports = JSON.parse(localStorage.getItem("admin_dispatched_reports")) || initialReports;
let map, markersLayer;
let baseLayers = {};
let currentTileLayer = null;
const defaultCenter = [12.9716, 77.5946];

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    checkAdminAuth();
});

function checkAdminAuth() {
    const isAuth = sessionStorage.getItem("admin_auth") === "true";
    const authOverlay = document.getElementById("authOverlay");
    if (isAuth) {
        authOverlay.style.display = "none";
        initMap();
        renderAdminPortal();
        updateStats();
    } else {
        authOverlay.style.display = "flex";
    }
}

function authenticateAdmin() {
    const pass = document.getElementById("passcodeInput").value;
    if (pass === "admin123" || pass === "cityadmin") {
        sessionStorage.setItem("admin_auth", "true");
        document.getElementById("authOverlay").style.display = "none";
        initMap();
        renderAdminPortal();
        updateStats();
        showToast("Welcome Administrator! Admin Portal Unlocked.");
    } else {
        alert("Invalid Administrator Passcode. Access Denied.");
        document.getElementById("passcodeInput").value = "";
    }
}

function logoutAdmin() {
    sessionStorage.removeItem("admin_auth");
    window.location.reload();
}

function initMap() {
    map = L.map('map-container', { zoomControl: false }).setView(defaultCenter, 13);
    L.control.zoom({ position: 'topright' }).addTo(map);

    baseLayers.default = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO'
    });

    baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    baseLayers.terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri'
    });

    currentTileLayer = baseLayers.default;
    currentTileLayer.addTo(map);

    markersLayer = L.layerGroup().addTo(map);
    renderMapMarkers();
}

function switchMapLayer(type) {
    if (!map || !baseLayers[type]) return;
    if (currentTileLayer) map.removeLayer(currentTileLayer);

    currentTileLayer = baseLayers[type];
    currentTileLayer.addTo(map);

    document.getElementById("btnMapDefaultAdmin").classList.remove("active");
    document.getElementById("btnMapSatelliteAdmin").classList.remove("active");
    document.getElementById("btnMapTerrainAdmin").classList.remove("active");

    if (type === 'default') document.getElementById("btnMapDefaultAdmin").classList.add("active");
    if (type === 'satellite') document.getElementById("btnMapSatelliteAdmin").classList.add("active");
    if (type === 'terrain') document.getElementById("btnMapTerrainAdmin").classList.add("active");
}

function resetMapView() {
    map.flyTo(defaultCenter, 13, { duration: 1.2 });
}

function renderMapMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    reports.forEach(r => {
        let color = '#2563eb';
        if (r.status === 'Resolved') color = '#10b981';
        else if (r.severity === 'High') color = '#ef4444';
        else if (r.water === 'Yes') color = '#0284c7';
        else color = '#f59e0b';

        const markerHtml = `<div style="background:${color}; width:20px; height:20px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 14px ${color};"></div>`;
        const customIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
        const popupContent = `
            <div style="font-family: 'JetBrains Mono', monospace; min-width: 170px; padding: 2px; color: #050811;">
                <div style="font-size: 0.75rem; font-weight: 800;">${r.id}</div>
                <div style="font-size: 0.875rem; font-weight: 900; margin: 2px 0;">${r.problem}</div>
                <div style="font-size: 0.75rem;">${r.location}</div>
                <div style="font-size: 0.75rem;">⚡ Urgency: <b>${r.score}/100</b></div>
                <div style="font-size: 0.75rem; margin-top: 4px;">Status: <b>${r.status}</b></div>
            </div>
        `;
        const marker = L.marker([r.lat, r.lng], { icon: customIcon }).bindPopup(popupContent);
        markersLayer.addLayer(marker);
    });
}

function renderAdminPortal() {
    const queueContainer = document.getElementById("adminCardsQueue");
    if (!queueContainer) return;

    const sortOrder = document.getElementById("sortOrderSelect").value;
    const statusFilter = document.getElementById("statusFilterSelect").value;

    let filtered = reports.filter(r => {
        if (statusFilter === "ALL") return true;
        return r.status === statusFilter;
    });

    filtered.sort((a, b) => {
        if (sortOrder === "DESC") return b.score - a.score;
        return a.score - b.score;
    });

    queueContainer.innerHTML = "";

    if (filtered.length === 0) {
        queueContainer.innerHTML = `
            <div style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-family: var(--font-mono);">
                <i data-lucide="check-circle-2" style="width: 48px; height: 48px; color: var(--neon-green); margin-bottom: 0.5rem;"></i>
                <p style="font-size: 1.1rem; font-weight: 800; color: white;">NO PENDING WORK ORDERS IN THIS FILTER</p>
                <p style="font-size: 0.8rem;">All user-uploaded issues in this category are resolved.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach((r, idx) => {
        const card = document.createElement("div");
        const rankNum = idx + 1;
        const isTopRank = rankNum === 1 && sortOrder === "DESC" && r.status === "Open";

        card.className = `admin-card ${isTopRank ? 'rank-1' : ''}`;

        let rankBadgeClass = "rank-tag";
        let rankLabel = `#${rankNum} HIGHEST URGENCY SCORE`;

        if (r.status === 'Resolved') {
            rankBadgeClass = "rank-tag resolved";
            rankLabel = `✓ RESOLVED / SOLVED BY ADMIN`;
        } else if (r.severity === 'Medium') {
            rankBadgeClass = "rank-tag medium";
            rankLabel = `#${rankNum} MEDIUM URGENCY SCORE`;
        } else if (r.severity === 'Low') {
            rankBadgeClass = "rank-tag medium";
            rankLabel = `#${rankNum} LOW URGENCY SCORE`;
        }

        card.innerHTML = `
            <div class="admin-card-top">
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <span class="${rankBadgeClass}">
                        <i data-lucide="flame" style="width: 14px; height: 14px;"></i> ${rankLabel}
                    </span>
                    <span style="font-family: var(--font-mono); font-weight: 900; color: var(--neon-cyan); font-size: 0.95rem;">${r.id}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">Urgency Rating:</span>
                    <span style="font-family: var(--font-mono); font-size: 1.1rem; font-weight: 900; color: ${r.score >= 80 ? '#ef4444' : r.score >= 50 ? '#f59e0b' : '#10b981'};">
                        ${r.score}/100
                    </span>
                </div>
            </div>

            <div class="admin-card-body">
                <div class="thumb-wrap">
                    <div>
                        <i data-lucide="camera" style="width:24px; height:24px; margin-bottom:4px; color:var(--neon-cyan);"></i><br>
                        <span>PHOTO TELEMETRY</span>
                    </div>
                </div>

                <div>
                    <div style="font-size: 0.95rem; font-weight: 800; color: white; margin-bottom: 0.4rem;">
                        ${r.stateText}
                    </div>
                    <div style="font-size: 0.825rem; color: var(--neon-cyan); margin-bottom: 0.85rem; font-family: var(--font-mono);">
                        ${r.location}
                    </div>

                    <div class="admin-metrics">
                        <div class="metric-item">
                            <span>DEFECT CATEGORY</span>
                            <strong>${r.problem}</strong>
                        </div>
                        <div class="metric-item">
                            <span>STRUCTURAL HEALTH</span>
                            <strong style="color: ${r.healthIndex <= 30 ? '#ef4444' : '#10b981'};">${r.healthIndex || 25}%</strong>
                        </div>
                        <div class="metric-item">
                            <span>EST. DIMENSIONS</span>
                            <strong>${r.dimensions || '0.85 m²'}</strong>
                        </div>
                        <div class="metric-item">
                            <span>SLA RESPONSE TARGET</span>
                            <strong style="color: #ef4444;">${r.sla}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="admin-actions-bar">
                ${r.status !== 'Resolved' ? `
                    <button class="btn-admin-solve" onclick="solveIssue('${r.id}')">
                        <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i> Mark Issue Solved
                    </button>
                ` : `
                    <button class="btn-admin-solve" style="background: rgba(16,185,129,0.2); border: 1px solid #10b981; color: #86efac;" disabled>
                        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Issue Solved & Closed
                    </button>
                `}

                ${r.status === 'Open' ? `
                    <button class="btn-admin-dispatch" onclick="dispatchSquad('${r.id}')">
                        <i data-lucide="truck" style="width: 16px; height: 16px;"></i> Dispatch Repair Squad
                    </button>
                ` : ''}

                <button class="btn-admin-inspect" onclick="focusOnMap(${r.lat}, ${r.lng})">
                    <i data-lucide="crosshair" style="width: 14px; height: 14px;"></i> Inspect on GIS Map
                </button>
            </div>
        `;

        queueContainer.appendChild(card);
    });

    lucide.createIcons();
}

function solveIssue(ticketId) {
    const item = reports.find(r => r.id === ticketId);
    if (item) {
        item.status = "Resolved";
        saveReports();
        renderAdminPortal();
        renderMapMarkers();
        updateStats();
        showToast(`✓ Ticket ${ticketId} Solved & Marked Closed by Administrator!`);
    }
}

function dispatchSquad(ticketId) {
    const item = reports.find(r => r.id === ticketId);
    if (item) {
        item.status = "In Progress";
        saveReports();
        renderAdminPortal();
        renderMapMarkers();
        updateStats();
        showToast(`🚜 Repair Squad Dispatched for Ticket ${ticketId}!`);
    }
}

function focusOnMap(lat, lng) {
    if (map) {
        map.flyTo([lat, lng], 17, { animate: true, duration: 1.5 });
        window.scrollTo({ top: document.getElementById("map-container").offsetTop - 80, behavior: 'smooth' });
    }
}

function updateStats() {
    document.getElementById("statTotal").textContent = reports.length;
    document.getElementById("statPotholes").textContent = reports.filter(r => r.severity === "High" && r.status !== "Resolved").length;
    document.getElementById("statFloods").textContent = reports.filter(r => r.water === "Yes" && r.status !== "Resolved").length;
    document.getElementById("statResolved").textContent = reports.filter(r => r.status === "Resolved").length;
}

function saveReports() {
    localStorage.setItem("admin_dispatched_reports", JSON.stringify(reports));
}

function showToast(message) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function exportDataCSV() {
    let csv = "TicketID,Location,Latitude,Longitude,DefectType,State,Severity,UrgencyScore,SLA,Status\n";
    const sorted = [...reports].sort((a,b) => b.score - a.score);
    sorted.forEach(r => {
        csv += `"${r.id}","${r.location}",${r.lat},${r.lng},"${r.problem}","${r.stateText}","${r.severity}",${r.score},"${r.sla}","${r.status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Admin_WorkOrders_HighToLow_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}
