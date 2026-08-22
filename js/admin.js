let reports = [];
let workers = [];
let map, markersLayer;
let selectedInspectedMarker = null;
let selectedInspectedCircle = null;
let baseLayers = {};
let currentTileLayer = null;
const defaultCenter = [12.9716, 77.5946];

const defaultDefectImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'><rect width='240' height='180' fill='%230f172a'/><circle cx='120' cy='90' r='45' fill='%23020617' stroke='%23ef4444' stroke-width='4'/><path d='M90 90 Q 120 70 150 90 T 120 110 Z' fill='%23ef4444' opacity='0.3'/><text x='120' y='95' fill='%23ef4444' font-size='12' font-weight='bold' text-anchor='middle' font-family='monospace'>DEFECT PHOTO TELEMETRY</text></svg>";

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
        fetchReportsFromAPI();
        fetchWorkersFromAPI();
        fetchRealMonsoonWeatherAlert();
    } else {
        authOverlay.style.display = "flex";
    }
}

function fetchRealMonsoonWeatherAlert(lat = 12.9716, lng = 77.5946) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=precipitation,rain`;
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (!data || !data.current_weather) return;
            const temp = data.current_weather.temperature;
            const wind = data.current_weather.windspeed;
            const code = data.current_weather.weathercode;
            
            let weatherDesc = "Monsoon Active / Overcast";
            let hazardLevel = "MODERATE";

            if (code >= 80 || code === 65 || code === 67) {
                weatherDesc = "⛈️ Heavy Downpour & High Hydro-Pothole Risk";
                hazardLevel = "CRITICAL HIGH";
            } else if (code >= 51 || code === 61 || code === 63) {
                weatherDesc = "🌧️ Active Rainfall & Drainage Saturation";
                hazardLevel = "HIGH";
            } else if (code >= 1 && code <= 3) {
                weatherDesc = "☁️ Monsoon Overcast & Sub-base Moisture Catchment";
                hazardLevel = "MODERATE";
            } else {
                weatherDesc = "🌦️ Post-Monsoon Damp Surface Alert";
                hazardLevel = "MONITORED";
            }

            const alertMsg = document.querySelector(".monsoon-alert-banner .alert-message");
            const alertBadge = document.querySelector(".monsoon-alert-banner .alert-badge");
            
            if (alertMsg) {
                alertMsg.innerHTML = `⚡ <strong>LIVE WEATHER TELEMETRY (${temp}°C | Wind ${wind} km/h):</strong> ${weatherDesc}. Hazard Status: <strong>${hazardLevel}</strong>. Active Waterlogged Defect Multiplier (1.25x).`;
            }
            if (alertBadge) {
                alertBadge.innerHTML = `<i data-lucide="cloud-rain" style="width:16px; height:16px; display:inline;"></i> LIVE WEATHER: ${hazardLevel}`;
            }
            lucide.createIcons();
        })
        .catch(err => {
            console.log("Weather API fallback:", err);
        });
}

function fetchReportsFromAPI() {
    fetch('/api/reports')
        .then(res => res.json())
        .then(data => {
            reports = data;
            renderAdminPortal();
            renderMapMarkers();
            updateStats();
        })
        .catch(err => {
            console.error("Admin API fetch error:", err);
        });
}

function fetchWorkersFromAPI() {
    fetch('/api/workers')
        .then(res => res.json())
        .then(data => {
            workers = data;
            renderWorkersTable();
        })
        .catch(err => {
            console.error("Worker fetch error:", err);
        });
}

function renderWorkersTable() {
    const tbody = document.getElementById("workersTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (workers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 2.5rem; color:var(--text-muted);">
                    <i data-lucide="user-plus" style="width:36px; height:36px; color:var(--neon-amber); margin-bottom:8px; display:inline-block;"></i><br>
                    <strong style="color:white; font-size:1rem;">NO FIELD WORKERS ADDED YET</strong><br>
                    <span style="font-size:0.8rem;">Click <strong>"➕ Add Field Worker Details Manually"</strong> above to register worker phone numbers & emails for automated dispatch alerts.</span>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    workers.forEach(w => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong style="color:#000000; font-weight:900;">${w.id}</strong></td>
            <td><span style="color:#831843; background:#fce7f3; border:2px solid #db2777; padding:4px 10px; border-radius:6px; font-size:0.85rem; font-weight:900;">${w.squad || w.name || 'Squad #1'}</span></td>
            <td><strong style="color:#000000; font-weight:900;">${w.name || w.lead || 'Worker'}</strong></td>
            <td style="color:#0f172a; font-weight:800;">${w.role || 'Field Engineer'}</td>
            <td style="color:#1d4ed8; font-weight:900;">📱 ${w.phone || '+1 (555) 019-2834'}</td>
            <td style="color:#047857; font-weight:900;">✉️ ${w.email || 'worker@citygov.org'}</td>
            <td>
                <button onclick="deleteWorkerContact('${w.id}')" style="background:#fee2e2; border:2px solid #dc2626; color:#7f1d1d; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.825rem; font-weight:900; font-family:var(--font-heading);">
                    🗑️ Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    lucide.createIcons();
}

function openAddWorkerModal() {
    const modal = document.getElementById("addWorkerModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeAddWorkerModal() {
    const modal = document.getElementById("addWorkerModalOverlay");
    if (modal) modal.style.display = "none";
}

function submitNewWorker() {
    const name = document.getElementById("newWorkerName").value.trim();
    const role = document.getElementById("newWorkerRole").value.trim();
    const squad = document.getElementById("newWorkerSquad").value;
    const phone = document.getElementById("newWorkerPhone").value.trim();
    const email = document.getElementById("newWorkerEmail").value.trim();

    if (!name || !phone || !email) {
        alert("Please enter Worker Name, Phone Number, and Email Address.");
        return;
    }

    const newWorkerObj = {
        squad,
        name,
        role: role || "Field Repair Tech",
        phone,
        email
    };

    fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkerObj)
    })
    .then(res => res.json())
    .then(data => {
        fetchWorkersFromAPI();
        closeAddWorkerModal();
        showToast(`✓ Worker ${name} Manually Saved! Phone: ${phone}, Email: ${email}`);
        document.getElementById("newWorkerName").value = "";
        document.getElementById("newWorkerPhone").value = "";
        document.getElementById("newWorkerEmail").value = "";
    })
    .catch(err => {
        alert("Failed to save worker contact.");
    });
}

function deleteWorkerContact(workerId) {
    if (!confirm(`Are you sure you want to remove worker ${workerId}?`)) return;

    fetch(`/api/workers?id=${workerId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(data => {
            fetchWorkersFromAPI();
            showToast(`✓ Worker ${workerId} removed.`);
        });
}

function authenticateAdmin() {
    const pass = document.getElementById("passcodeInput").value;
    if (pass === "admin123" || pass === "cityadmin") {
        sessionStorage.setItem("admin_auth", "true");
        document.getElementById("authOverlay").style.display = "none";
        initMap();
        fetchReportsFromAPI();
        fetchWorkersFromAPI();
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

let satelliteLabelsLayerAdmin = null;

function initMap() {
    map = L.map('map-container', { zoomControl: false }).setView(defaultCenter, 13);
    L.control.zoom({ position: 'topright' }).addTo(map);

    baseLayers.default = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        maxZoom: 19
    });

    baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
        maxNativeZoom: 18
    });

    baseLayers.terrain = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles © Esri',
        maxZoom: 19,
        maxNativeZoom: 18
    });

    satelliteLabelsLayerAdmin = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 18
    });

    currentTileLayer = baseLayers.default;
    currentTileLayer.addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 300);
}

function switchMapLayer(type) {
    if (!map || !baseLayers[type]) return;
    if (currentTileLayer) map.removeLayer(currentTileLayer);
    if (satelliteLabelsLayerAdmin && map.hasLayer(satelliteLabelsLayerAdmin)) {
        map.removeLayer(satelliteLabelsLayerAdmin);
    }

    currentTileLayer = baseLayers[type];
    currentTileLayer.addTo(map);

    if (type === 'satellite' && satelliteLabelsLayerAdmin) {
        satelliteLabelsLayerAdmin.addTo(map);
    }

    const btnDef = document.getElementById("btnMapDefaultAdmin");
    const btnSat = document.getElementById("btnMapSatelliteAdmin");
    const btnTer = document.getElementById("btnMapTerrainAdmin");

    if (btnDef) btnDef.classList.remove("active");
    if (btnSat) btnSat.classList.remove("active");
    if (btnTer) btnTer.classList.remove("active");

    if (type === 'default' && btnDef) btnDef.classList.add("active");
    if (type === 'satellite' && btnSat) btnSat.classList.add("active");
    if (type === 'terrain' && btnTer) btnTer.classList.add("active");

    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 100);
}

function renderMapMarkers() {
    if (!markersLayer) return;
    markersLayer.clearLayers();

    reports.forEach(r => {
        let color = '#2563eb';
        if (r.status.includes('Resolved') || r.status.includes('SOLVED')) color = '#10b981';
        else if (r.severity === 'High') color = '#ef4444';
        else if (r.water === 'Yes') color = '#0284c7';
        else color = '#f59e0b';

        const markerHtml = `<div style="background:${color}; width:20px; height:20px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 14px ${color};"></div>`;
        const customIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
        const popupContent = `
            <div style="font-family: 'JetBrains Mono', monospace; min-width: 180px; padding: 4px; color: #050811;">
                <div style="font-size: 0.75rem; font-weight: 800; color: #ef4444;">📍 DISPATCH TICKET LOCATION</div>
                <div style="font-size: 0.9rem; font-weight: 900; margin: 2px 0;">${r.id}: ${r.problem}</div>
                <div style="font-size: 0.775rem;">${r.location}</div>
                <div style="font-size: 0.75rem; margin-top: 2px;">⚡ Urgency: <b>${r.score}/100</b></div>
                <div style="font-size: 0.75rem; margin-top: 2px;">Status: <b>${r.status}</b></div>
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
        if (statusFilter === "Open") return !r.status.includes("Resolved") && !r.status.includes("SOLVED");
        if (statusFilter === "Resolved") return r.status.includes("Resolved") || r.status.includes("SOLVED");
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
                <p style="font-size: 0.8rem;">All user-uploaded issues in this category are resolved or empty.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach((r, idx) => {
        const card = document.createElement("div");
        const rankNum = idx + 1;
        const isResolved = r.status.includes('Resolved') || r.status.includes('SOLVED');
        const isTopRank = rankNum === 1 && sortOrder === "DESC" && !isResolved;

        card.className = `admin-card ${isTopRank ? 'rank-1' : ''}`;
        card.id = `card-${r.id.replace('#', '')}`;

        let rankBadgeClass = "rank-tag";
        let rankLabel = `#${rankNum} HIGHEST URGENCY SCORE`;

        if (isResolved) {
            rankBadgeClass = "rank-tag resolved";
            rankLabel = `✓ AI VERIFIED & SOLVED`;
        } else if (r.severity === 'Medium') {
            rankBadgeClass = "rank-tag medium";
            rankLabel = `#${rankNum} MEDIUM URGENCY SCORE`;
        } else if (r.severity === 'Low') {
            rankBadgeClass = "rank-tag medium";
            rankLabel = `#${rankNum} LOW URGENCY SCORE`;
        }

        const squadName = r.assignedSquad || "🚜 Squad #1 (Auto-Assigned)";
        const workerCount = r.workerCount || (r.assignedWorkers ? r.assignedWorkers.length : 0);

        const workerBatch = r.assignedWorkers && r.assignedWorkers.length > 0 ? r.assignedWorkers : [];

        const workersBadgesHtml = (r.assignedWorkers && r.assignedWorkers.length > 0) ? r.assignedWorkers.map(w => `
            <span style="display:inline-flex; align-items:center; gap:6px; background:#FEF3C7; border:2px solid #D97706; color:#000000; font-family:var(--font-heading); font-size:0.875rem; font-weight:800; padding:6px 12px; border-radius:6px;">
                👤 <strong style="color:#000000;">${w.name}</strong> (📱 <span style="color:#000000;">${w.phone || 'Pending'}</span> | ✉️ <span style="color:#000000;">${w.email || 'Pending'}</span>)
            </span>
        `).join(" ") : `<span style="color:#000000; font-family:var(--font-heading); font-weight:800; font-size:0.875rem;">🚜 Assigned to ${squadName} (${workerCount > 0 ? workerCount : 5} Field Technicians)</span>`;

        const beforePhotoSrc = r.imageData || defaultDefectImage;
        const beforePhotoHtml = `<img src="${beforePhotoSrc}" alt="Before Defect Photo" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">`;

        const afterPhotoHtml = r.afterImageData ? 
            `<img src="${r.afterImageData}" alt="After Repair Photo" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` :
            `<div style="color:#000000; font-size:0.85rem; font-weight:800; text-align:center; padding:10px;">
                <i data-lucide="clock" style="width:24px; height:24px; color:#B45309; margin-bottom:4px;"></i><br>
                Awaiting Worker Upload
            </div>`;

        card.innerHTML = `
            <div class="admin-card-top">
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <span class="${rankBadgeClass}">
                        <i data-lucide="flame" style="width: 14px; height: 14px;"></i> ${rankLabel}
                    </span>
                    <span style="font-family: var(--font-heading); font-weight: 900; color: #1D4ED8; font-size: 1.05rem;">${r.id}</span>
                    <span style="font-family: var(--font-heading); font-size: 0.85rem; font-weight: 900; color: #000000; background: #FCE7F3; padding: 5px 12px; border-radius: 6px; border: 2px solid #DB2777;">
                        ${squadName} ${workerCount > 0 ? `(${workerCount} Workers)` : ''}
                    </span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span style="font-family: var(--font-heading); font-size: 0.9rem; font-weight: 800; color: #000000;">Urgency Rating:</span>
                    <span style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 900; color: ${r.score >= 80 ? '#B91C1C' : r.score >= 50 ? '#B45309' : '#047857'};">
                        ${r.score}/100
                    </span>
                </div>
            </div>

            <!-- DISPATCHED WORKERS CREW BATCH WITH PHONE & EMAIL -->
            <div style="margin: 0.8rem 0 1rem 0; padding: 0.85rem 1rem; background: #FEF3C7; border: 2px solid #D97706; border-radius: 8px;">
                <div style="font-family: var(--font-heading); font-size: 0.9rem; color: #000000; margin-bottom: 6px; font-weight: 900; display:flex; align-items:center; gap:6px;">
                    <i data-lucide="smartphone" style="width:16px; height:16px; color:#B45309;"></i> DISPATCH SMS & EMAIL ALERTS TO MANUALLY ADDED WORKERS:
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${workersBadgesHtml}
                </div>
            </div>

            <div class="admin-card-body">
                <!-- SIDE BY SIDE BEFORE VS AFTER PHOTO TELEMETRY -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="thumb-wrap" style="height: 140px;" onclick="event.stopPropagation(); openImageModal('${beforePhotoSrc}', '${r.id} (BEFORE DEFECT)', '${r.location}')">
                        ${beforePhotoHtml}
                        <div class="thumb-overlay-tag" style="background:#Fee2e2; color:#b91c1c; border:2px solid #b91c1c;">📷 BEFORE</div>
                    </div>

                    <div class="thumb-wrap" style="height: 140px; border-color: ${r.afterImageData ? '#047857' : '#cbd5e1'};" onclick="event.stopPropagation(); ${r.afterImageData ? `openImageModal('${r.afterImageData}', '${r.id} (AFTER REPAIR)', '${r.location}')` : ''}">
                        ${afterPhotoHtml}
                        <div class="thumb-overlay-tag" style="background: ${r.afterImageData ? '#d1fae5' : '#ffffff'}; color: ${r.afterImageData ? '#047857' : '#000000'}; border: 2px solid ${r.afterImageData ? '#047857' : '#64748b'};">
                            ${r.afterImageData ? '✅ AFTER' : '⏳ PENDING'}
                        </div>
                    </div>
                </div>

                <div>
                    <div style="font-size: 1.05rem; font-weight: 900; color: #000000; margin-bottom: 0.4rem;">
                        ${r.stateText}
                    </div>
                    <div style="font-size: 0.9rem; color: #1D4ED8; font-weight: 800; margin-bottom: 0.85rem; font-family: var(--font-heading);">
                        📍 Live GPS: ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)} — ${r.location}
                    </div>

                    <div class="admin-metrics">
                        <div class="metric-item">
                            <span>DEFECT CATEGORY</span>
                            <strong>${r.problem}</strong>
                        </div>
                        <div class="metric-item">
                            <span>AUTO SQUAD ASSIGNED</span>
                            <strong style="color: #000000;">${squadName.split(' ')[1] || 'Squad #1'} ${workerCount > 0 ? `(${workerCount} Workers)` : ''}</strong>
                        </div>
                        <div class="metric-item">
                            <span>EST. DIMENSIONS</span>
                            <strong>${r.dimensions || '0.85 m²'}</strong>
                        </div>
                        <div class="metric-item">
                            <span>SLA RESPONSE TARGET</span>
                            <strong style="color: #b91c1c;">${r.sla}</strong>
                        </div>
                    </div>

                    <!-- AI AUTOMATED TECHNICAL BRIEF & MATERIALS CHECKLIST -->
                    <div style="margin-top: 0.85rem; padding: 0.9rem 1.1rem; background: #E0F2FE; border: 2px solid #0284C7; border-radius: 8px; font-family: var(--font-heading); color: #000000; font-size: 0.9rem;">
                        <div style="font-size: 0.9rem; font-weight: 900; color: #0369A1; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="cpu" style="width: 16px; height: 16px;"></i> 🤖 AI AUTOMATED REPAIR INSTRUCTIONS & MATERIALS:
                        </div>
                        <div style="font-size: 0.9rem; color: #000000; font-weight: 800; margin-bottom: 6px;">
                            ${r.aiTechnicalBrief || "AI CRATER SEGMENTATION: Structural sub-base cavity defect detected. Recommended action: Excavate 15cm cavity + compaction paving."}
                        </div>
                        <div style="font-size: 0.875rem; color: #000000; font-weight: 800; white-space: pre-line;">
                            ${r.aiMaterialsChecklist || "• 3.0 Tons Asphalt Concrete\n• Vibratory Plate Compactor\n• Tack Coat Adhesive Spray"}
                        </div>
                    </div>
                </div>
            </div>

            ${r.verificationScore ? `
                <div style="margin-top: 1rem; padding: 0.85rem 1.1rem; background: #d1fae5; border: 2px solid #047857; border-radius: 8px; font-family: var(--font-heading); font-size: 0.9rem; color: #064e3b; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                    <span>🤖 AI BEFORE VS. AFTER REPAIR MATCH: <strong style="color:#000000; font-weight:900;">${r.verificationScore}%</strong> (${r.verificationDetail})</span>
                    <span style="font-weight: 900; color:#047857;">✓ VERIFIED & SOLVED</span>
                </div>
            ` : ''}

            <div class="admin-actions-bar">
                ${!isResolved ? `
                    <button class="btn-admin-solve" onclick="event.stopPropagation(); solveIssue('${r.id}')">
                        <i data-lucide="check-circle-2" style="width: 16px; height: 16px;"></i> Mark Issue Solved
                    </button>
                ` : `
                    <button class="btn-admin-solve" style="background: #d1fae5; border: 2px solid #047857; color: #064e3b; font-weight:900;" disabled>
                        <i data-lucide="check-circle" style="width: 16px; height: 16px;"></i> Issue Solved & AI Verified
                    </button>
                `}

                <button class="btn-admin-inspect" onclick="event.stopPropagation(); focusOnMap('${r.id}', ${r.lat}, ${r.lng})">
                    <i data-lucide="crosshair" style="width: 14px; height: 14px;"></i> Inspect on GIS Map
                </button>

                <a href="worker.html" class="btn-admin-inspect" style="background: #fce7f3; border-color: #db2777; color: #831843; text-decoration:none; font-weight:800;">
                    <i data-lucide="hard-hat" style="width: 14px; height: 14px;"></i> Open Worker Portal
                </a>
            </div>
        `;

        card.addEventListener('click', () => focusOnMap(r.id, r.lat, r.lng));
        queueContainer.appendChild(card);
    });

    lucide.createIcons();
}

function openImageModal(imgData, titleText, locationText) {
    const modal = document.getElementById("imageModalOverlay");
    const modalImg = document.getElementById("modalImgTarget");
    const modalTitle = document.getElementById("modalTicketTitle");
    const modalLoc = document.getElementById("modalLocText");

    if (modal && modalImg) {
        modalImg.src = imgData;
        modalTitle.textContent = `📸 DEFECT INSPECTION: ${titleText}`;
        modalLoc.textContent = `📍 Location: ${locationText}`;
        modal.style.display = "flex";
    }
}

function closeImageModal() {
    const modal = document.getElementById("imageModalOverlay");
    if (modal) modal.style.display = "none";
}

function focusOnMap(ticketId, lat, lng) {
    if (!map) return;

    document.querySelectorAll('.admin-card').forEach(c => c.classList.remove('active-inspected'));
    const cardEl = document.getElementById(`card-${ticketId.replace('#', '')}`);
    if (cardEl) cardEl.classList.add('active-inspected');

    const item = reports.find(r => r.id === ticketId);
    const locText = item ? item.location : `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
    const problemText = item ? item.problem : 'Road Defect';

    if (selectedInspectedMarker) map.removeLayer(selectedInspectedMarker);
    if (selectedInspectedCircle) map.removeLayer(selectedInspectedCircle);

    const targetIcon = L.divIcon({
        html: `<div class="selected-admin-marker"></div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13]
    });

    const popupHtml = `
        <div style="font-family: 'JetBrains Mono', monospace; min-width: 190px; padding: 4px; color: #050811;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #ef4444;">🔴 INSPECTED WORK ORDER LOCATION</div>
            <div style="font-size: 0.95rem; font-weight: 900; margin: 2px 0;">${ticketId}: ${problemText}</div>
            <div style="font-size: 0.775rem;">${locText}</div>
            <div style="font-size: 0.725rem; margin-top: 4px; color: #2563eb;">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>
    `;

    selectedInspectedMarker = L.marker([lat, lng], { icon: targetIcon }).bindPopup(popupHtml).addTo(map);
    selectedInspectedMarker.openPopup();

    selectedInspectedCircle = L.circle([lat, lng], {
        radius: 35,
        color: '#ef4444',
        fillColor: '#ef4444',
        fillOpacity: 0.2,
        weight: 2
    }).addTo(map);

    map.flyTo([lat, lng], 18, { animate: true, duration: 1.4 });
    window.scrollTo({ top: document.getElementById("map-container").offsetTop - 80, behavior: 'smooth' });
    showToast(`📍 GIS Map Locked to ${ticketId} Live Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
}

function updateReportStatusAPI(ticketId, newStatus, message) {
    fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: newStatus })
    })
    .then(res => res.json())
    .then(data => {
        fetchReportsFromAPI();
        showToast(message);
    })
    .catch(err => {
        const item = reports.find(r => r.id === ticketId);
        if (item) item.status = newStatus;
        renderAdminPortal();
        renderMapMarkers();
        updateStats();
        showToast(message);
    });
}

function solveIssue(ticketId) {
    updateReportStatusAPI(ticketId, "Resolved", `✓ Ticket ${ticketId} Solved & Marked Closed by Administrator!`);
}

let barChartInstance = null;
let doughnutChartInstance = null;

function updateStats() {
    document.getElementById("statTotal").textContent = reports.length;
    document.getElementById("statPotholes").textContent = reports.filter(r => r.severity === "High" && !r.status.includes("Resolved") && !r.status.includes("SOLVED")).length;
    document.getElementById("statFloods").textContent = reports.filter(r => r.water === "Yes" && !r.status.includes("Resolved") && !r.status.includes("SOLVED")).length;
    document.getElementById("statResolved").textContent = reports.filter(r => r.status.includes("Resolved") || r.status.includes("SOLVED")).length;
    renderAnalyticsCharts();
}

function renderAnalyticsCharts() {
    if (typeof Chart === 'undefined') return;

    const barCtx = document.getElementById("analyticsBarChart");
    const doughnutCtx = document.getElementById("analyticsDoughnutChart");
    if (!barCtx || !doughnutCtx) return;

    const highCount = reports.filter(r => r.severity === "High" && !r.status.includes("Resolved") && !r.status.includes("SOLVED")).length;
    const medCount = reports.filter(r => r.severity === "Medium" && !r.status.includes("Resolved") && !r.status.includes("SOLVED")).length;
    const lowCount = reports.filter(r => r.severity === "Low" && !r.status.includes("Resolved") && !r.status.includes("SOLVED")).length;
    const waterloggedCount = reports.filter(r => r.water === "Yes" && !r.status.includes("Resolved") && !r.status.includes("SOLVED")).length;
    const resolvedCount = reports.filter(r => r.status.includes("Resolved") || r.status.includes("SOLVED")).length;

    if (barChartInstance) barChartInstance.destroy();
    if (doughnutChartInstance) doughnutChartInstance.destroy();

    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: ['Critical (High)', 'Medium Urgency', 'Low Urgency', 'Waterlogged', 'AI Resolved'],
            datasets: [{
                label: 'Active Infrastructure Defects',
                data: [highCount, medCount, lowCount, waterloggedCount, resolvedCount],
                backgroundColor: [
                    'rgba(239, 68, 68, 0.75)',
                    'rgba(245, 158, 11, 0.75)',
                    'rgba(59, 130, 246, 0.75)',
                    'rgba(0, 255, 204, 0.75)',
                    'rgba(16, 185, 129, 0.75)'
                ],
                borderColor: [
                    '#ef4444',
                    '#f59e0b',
                    '#3b82f6',
                    '#00ffcc',
                    '#10b981'
                ],
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Defect Category & Urgency Volume', color: '#94a3b8', font: { family: 'JetBrains Mono', size: 12 } }
            },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            }
        }
    });

    doughnutChartInstance = new Chart(doughnutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Active Defects', 'AI Resolved'],
            datasets: [{
                data: [Math.max(0, reports.length - resolvedCount), resolvedCount],
                backgroundColor: ['rgba(239, 68, 68, 0.8)', 'rgba(16, 185, 129, 0.8)'],
                borderColor: ['#ef4444', '#10b981'],
                borderWidth: 1.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } } },
                title: { display: true, text: 'Resolution Ratio', color: '#94a3b8', font: { family: 'JetBrains Mono', size: 12 } }
            }
        }
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function exportDataCSV() {
    let csv = "TicketID,Location,Latitude,Longitude,DefectType,State,Severity,UrgencyScore,SLA,Status,AssignedSquad,WorkerCount,WorkerContacts\n";
    const sorted = [...reports].sort((a,b) => b.score - a.score);
    sorted.forEach(r => {
        const contacts = (r.assignedWorkers || []).map(w => `${w.name} (Ph: ${w.phone || ''}, Email: ${w.email || ''})`).join("; ");
        csv += `"${r.id}","${r.location}",${r.lat},${r.lng},"${r.problem}","${r.stateText}","${r.severity}",${r.score},"${r.sla}","${r.status}","${r.assignedSquad||''}",${r.workerCount||0},"${contacts}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Admin_WorkOrders_HighToLow_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
}
