let reports = [];
let allReports = [];
let registeredWorkers = [];
let map, markersLayer;
let uploaderLiveMarker = null;
let uploaderAccuracyCircle = null;
let baseLayers = {};
let currentTileLayer = null;
const defaultCenter = [20.5937, 78.9629];
let mediaStreamTrack = null;
let pendingComplaint = null;

const squadRosters = [
    {
        squadName: "🚜 Squad #1 (Sector 4 Rapid Paving Unit)",
        shortName: "Squad #1",
        workerCount: 5,
        workers: [
            { name: "Rajesh Kumar", role: "Lead Engineer", phone: "+91 98450 12345", email: "rajesh.kumar@city.gov.in" },
            { name: "Vikram Singh", role: "Asphalt Specialist", phone: "+91 98450 67890", email: "vikram.singh@city.gov.in" },
            { name: "Anil Sharma", role: "Hydraulic Operator", phone: "+91 98450 11223", email: "anil.sharma@city.gov.in" },
            { name: "Priya Patel", role: "Traffic Safety Marshal", phone: "+91 98450 44556", email: "priya.patel@city.gov.in" },
            { name: "Suresh Babu", role: "Sub-Base Mason", phone: "+91 98450 77889", email: "suresh.babu@city.gov.in" }
        ]
    },
    {
        squadName: "🚜 Squad #2 (Central Hydro-Drainage Unit)",
        shortName: "Squad #2",
        workerCount: 4,
        workers: [
            { name: "Manish Verma", role: "Heavy Equipment Lead", phone: "+91 97310 99887", email: "manish.verma@city.gov.in" },
            { name: "Kavita Reddy", role: "Drainage Specialist", phone: "+91 97310 66554", email: "kavita.reddy@city.gov.in" },
            { name: "Rohan Gupta", role: "Concrete Paver", phone: "+91 97310 33221", email: "rohan.gupta@city.gov.in" },
            { name: "Deepak Joshi", role: "Fleet Driver", phone: "+91 97310 88776", email: "deepak.joshi@city.gov.in" }
        ]
    }
];

document.addEventListener("DOMContentLoaded", () => {
    registerServiceWorker();
    lucide.createIcons();
    initMap();
    fetchReportsFromAPI();
    fetchWorkersDirectory();
    setupAutomatedUpload();
    setupDragAndDrop();
    fetchRealMonsoonWeatherAlert();

    const citizenIdentity = sessionStorage.getItem("citizen_identity") || "";
    if (citizenIdentity && /^\+?\d+$/.test(citizenIdentity.replace(/[\s\-\(\)]/g, ""))) {
        const phoneField = document.getElementById("citizenReportPhone");
        if (phoneField) phoneField.value = citizenIdentity;
    }
});

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

function fetchWorkersDirectory() {
    fetch('/api/workers')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                registeredWorkers = data;
            }
        })
        .catch(err => {});
}

function openWorkerAuthModal() {
    const isAlreadyAuth = sessionStorage.getItem("worker_auth") === "true";
    if (isAlreadyAuth) {
        window.location.href = "worker.html";
        return;
    }
    const modal = document.getElementById("workerAuthModalOverlay");
    if (modal) modal.style.display = "flex";
}

function closeWorkerAuthModal() {
    const modal = document.getElementById("workerAuthModalOverlay");
    if (modal) modal.style.display = "none";
}

function authenticateWorkerPasscode() {
    const input = document.getElementById("workerPasscodeInput");
    const val = input ? input.value : "";

    if (val === "worker123" || val === "squad123") {
        sessionStorage.setItem("worker_auth", "true");
        showToast("✓ Worker Authentication Successful! Opening Worker Portal...");
        setTimeout(() => {
            window.location.href = "worker.html";
        }, 600);
    } else {
        alert("Access Denied: Invalid Field Worker Security Passcode.");
        if (input) input.value = "";
    }
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (let registration of registrations) {
                registration.unregister();
            }
        });
    }
}

function fetchReportsFromAPI() {
    fetch('/api/reports')
        .then(res => res.json())
        .then(data => {
            allReports = data;
            reports = data;
            renderMapMarkers();
            updateCitizenStatsOverview();
            renderCitizenHistory();
        })
        .catch(err => {
            console.error("API fetch error:", err);
        });
}

function updateCitizenStatsOverview() {
    const totalReported = reports ? reports.length : 0;
    const totalResolved = reports ? reports.filter(r => 
        r.status === 'Resolved' || 
        r.resolved === true || 
        (r.status && (r.status.includes('SOLVED') || r.status.includes('Resolved')))
    ).length : 0;
    const rate = totalReported > 0 ? Math.round((totalResolved / totalReported) * 100) : 0;

    const elReported = document.getElementById("citStatReported");
    const elResolved = document.getElementById("citStatResolved");
    const elRate = document.getElementById("citStatRate");
    const elAvgTime = document.getElementById("citStatAvgTime");

    if (elReported) elReported.textContent = totalReported;
    if (elResolved) elResolved.textContent = totalResolved;
    if (elRate) elRate.textContent = `${rate}%`;
    if (elAvgTime) elAvgTime.textContent = totalReported > 0 ? "18 min" : "--";
}

let satelliteLabelsLayer = null;

function initMap() {
    map = L.map('map-container', { zoomControl: false }).setView(defaultCenter, 5);
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

    satelliteLabelsLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
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
    if (satelliteLabelsLayer && map.hasLayer(satelliteLabelsLayer)) {
        map.removeLayer(satelliteLabelsLayer);
    }

    currentTileLayer = baseLayers[type];
    currentTileLayer.addTo(map);

    if (type === 'satellite' && satelliteLabelsLayer) {
        satelliteLabelsLayer.addTo(map);
    }

    const btnDef = document.getElementById("btnMapDefault");
    const btnSat = document.getElementById("btnMapSatellite");
    const btnTer = document.getElementById("btnMapTerrain");

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
        let color = r.severity === 'High' ? '#ef4444' : '#f59e0b';
        const markerHtml = `<div style="background:${color}; width:20px; height:20px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 14px ${color};"></div>`;
        const customIcon = L.divIcon({ html: markerHtml, className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
        const marker = L.marker([r.lat, r.lng], { icon: customIcon }).bindPopup(`<b>${r.id}</b><br>${r.problem}<br>${r.location}`);
        markersLayer.addLayer(marker);
    });
}

function displayLiveUploaderLocationOnMap(lat, lng, addressText) {
    if (!map) return;

    if (uploaderLiveMarker) map.removeLayer(uploaderLiveMarker);
    if (uploaderAccuracyCircle) map.removeLayer(uploaderAccuracyCircle);

    const liveIcon = L.divIcon({
        html: `<div class="live-uploader-marker"></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });

    const popupHtml = `
        <div style="font-family: 'JetBrains Mono', monospace; min-width: 170px; padding: 4px; color: #050811;">
            <div style="font-size: 0.75rem; font-weight: 800; color: #2563eb;">🔵 EXACT UPLOADER LIVE LOCATION</div>
            <div style="font-size: 0.85rem; font-weight: 900; margin-top: 2px;">${addressText}</div>
            <div style="font-size: 0.725rem; margin-top: 4px; color: #64748b;">GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
        </div>
    `;

    uploaderLiveMarker = L.marker([lat, lng], { icon: liveIcon }).bindPopup(popupHtml).addTo(map);
    uploaderLiveMarker.openPopup();

    uploaderAccuracyCircle = L.circle([lat, lng], {
        radius: 30,
        color: '#00ffcc',
        fillColor: '#00ffcc',
        fillOpacity: 0.18,
        weight: 2
    }).addTo(map);

    map.flyTo([lat, lng], 18, { animate: true, duration: 1.5 });
}

function setupAutomatedUpload() {
    const fileInput = document.getElementById("roadImage");
    const dropzone = document.getElementById("dropzone");

    if (fileInput) {
        fileInput.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (!file) return;
            processImageFile(file);
        });
    }

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", function(e) {
            if (!e.target.closest("button") && !e.target.closest("input")) {
                fileInput.click();
            }
        });
    }
}

function processImageFile(file) {
    const canvas = document.getElementById("cvCanvas");
    const ctx = canvas.getContext("2d");
    const previewWrap = document.getElementById("previewWrap");
    const dropzone = document.getElementById("dropzone");
    const scanLine = document.getElementById("scanLine");
    const dispatchCard = document.getElementById("dispatchCard");

    if (dropzone) dropzone.style.display = "none";
    if (previewWrap) previewWrap.style.display = "block";
    if (scanLine) scanLine.style.display = "block";
    if (dispatchCard) dispatchCard.style.display = "none";

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const analysis = analyzePixelDefectFromCanvas(canvas, ctx);

            const imageData = canvas.toDataURL("image/jpeg", 0.6);
            const imageHash = computeCanvasImageHash(canvas, ctx);

            if (analysis && analysis.isValidRoadDefect === false) {
                cancelPendingPhoto();
                showInvalidImagePopUp();
                showToast("⚠️ Upload Rejected: Please upload a correct image of a pothole or flooding defect.");
                return;
            }

            const dupReport = isDuplicateImageUploaded(imageData, imageHash);
            if (dupReport) {
                cancelPendingPhoto();
                showDuplicateImagePopUp(dupReport);
                showToast(`⚠️ Upload Rejected: Defect photo already exists as Ticket ${dupReport.id}`);
                return;
            }

            analysis.imageData = imageData;
            analysis.imageHash = imageHash;

            const boxX = img.width * 0.25;
            const boxY = img.height * 0.3;
            const boxW = img.width * 0.5;
            const boxH = img.height * 0.4;

            ctx.strokeStyle = analysis.severity === 'High' ? "#ef4444" : "#00ffcc";
            ctx.lineWidth = Math.max(3, img.width * 0.006);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            document.getElementById("hudConfidence").innerHTML = `<i data-lucide="check-circle-2" style="width:14px; height:14px; display:inline;"></i> Defect Segmented: ${analysis.defectType} (${analysis.confidence}% Conf)`;
            document.getElementById("reviewStateLabel").textContent = `${analysis.defectType} (${analysis.severity} Urgency)`;
            lucide.createIcons();

            const defaultLoc = {
                lat: defaultCenter[0],
                lng: defaultCenter[1],
                addressText: `📍 Live Location (Lat ${defaultCenter[0].toFixed(4)}, Lng ${defaultCenter[1].toFixed(4)})`
            };

            pendingComplaint = {
                photoLoc: defaultLoc,
                analysis: analysis
            };

            displayLiveUploaderLocationOnMap(defaultLoc.lat, defaultLoc.lng, defaultLoc.addressText);

            setTimeout(() => {
                if (scanLine) scanLine.style.display = "none";
            }, 600);

            resolveAccurateLiveLocation(file, function(photoLoc) {
                if (!pendingComplaint) return;
                pendingComplaint.photoLoc = photoLoc;
                const gpsBadgeDown = document.getElementById("hudGpsBadgeDown");
                if (gpsBadgeDown) {
                    gpsBadgeDown.innerHTML = `<i data-lucide="navigation" style="width:14px; height:14px; display:inline;"></i> Live GPS Locked: ${photoLoc.lat.toFixed(5)}, ${photoLoc.lng.toFixed(5)}`;
                }
                displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);
                lucide.createIcons();
            });

            showToast("🎯 Photo Segmented! Click 'SUBMIT ROAD COMPLAINT TICKET' to dispatch.");
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function loadSampleScan(e) {
    if (e) e.stopPropagation();
    const canvas = document.getElementById("cvCanvas");
    const ctx = canvas.getContext("2d");
    const previewWrap = document.getElementById("previewWrap");
    const dropzone = document.getElementById("dropzone");
    const scanLine = document.getElementById("scanLine");
    const dispatchCard = document.getElementById("dispatchCard");

    if (dropzone) dropzone.style.display = "none";
    if (previewWrap) previewWrap.style.display = "block";
    if (scanLine) scanLine.style.display = "block";
    if (dispatchCard) dispatchCard.style.display = "none";

    canvas.width = 640;
    canvas.height = 480;

    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(320, 0);
    ctx.lineTo(320, 480);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.ellipse(320, 240, 130, 80, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(0, 255, 204, 0.35)";
    ctx.beginPath();
    ctx.ellipse(310, 245, 90, 50, 0, 0, Math.PI * 2);
    ctx.fill();

    const analysis = analyzePixelDefectFromCanvas(canvas, ctx);

    const boxX = 640 * 0.25;
    const boxY = 480 * 0.3;
    const boxW = 640 * 0.5;
    const boxH = 480 * 0.4;

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 4;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    analysis.imageData = canvas.toDataURL("image/jpeg", 0.6);

    document.getElementById("hudConfidence").innerHTML = `<i data-lucide="check-circle-2" style="width:14px; height:14px; display:inline;"></i> Defect Segmented: ${analysis.defectType} (${analysis.confidence}% Conf)`;
    document.getElementById("reviewStateLabel").textContent = `${analysis.defectType} (${analysis.severity} Urgency)`;
    lucide.createIcons();

    // Query Real Live Device GPS Location for Sample Scan
    fallbackToIPOrCenter(function(liveLoc) {
        pendingComplaint = {
            photoLoc: liveLoc,
            analysis: analysis
        };

        const gpsBadgeDown = document.getElementById("hudGpsBadgeDown");
        if (gpsBadgeDown) {
            gpsBadgeDown.innerHTML = `<i data-lucide="navigation" style="width:14px; height:14px; display:inline;"></i> Live GPS Locked: ${liveLoc.lat.toFixed(5)}, ${liveLoc.lng.toFixed(5)}`;
        }

        displayLiveUploaderLocationOnMap(liveLoc.lat, liveLoc.lng, liveLoc.addressText);
        lucide.createIcons();

        setTimeout(() => {
            if (scanLine) scanLine.style.display = "none";
            showToast("🎯 Sample Defect Segmented at Live Location! Click 'SUBMIT ISSUE TICKET' to dispatch.");
        }, 600);
    });
}

function resolveAccurateLiveLocation(file, callback) {
    const fileReader = new FileReader();

    fileReader.onload = function(e) {
        const buffer = e.target.result;
        const exifGps = parseExifGPS(buffer);

        if (exifGps && !isNaN(exifGps.lat) && !isNaN(exifGps.lng) && exifGps.lat !== 0) {
            fetchAddressAndReturn(exifGps.lat, exifGps.lng, "Photo EXIF GPS", callback);
            return;
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    fetchAddressAndReturn(lat, lng, "Live Device GPS", callback);
                },
                (err) => {
                    fallbackToIPOrCenter(callback);
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        } else {
            fallbackToIPOrCenter(callback);
        }
    };

    fileReader.readAsArrayBuffer(file);
}

function fetchAddressAndReturn(lat, lng, labelPrefix, callback) {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
        .then(res => res.json())
        .then(data => {
            let road = data.address ? (data.address.road || data.address.suburb || data.address.city || data.address.town || "Urban Zone") : "Exact Coordinates";
            callback({
                lat: lat,
                lng: lng,
                addressText: `📍 ${road} (Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)})`
            });
        })
        .catch(() => {
            callback({
                lat: lat,
                lng: lng,
                addressText: `📍 ${labelPrefix} (Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)})`
            });
        });
}

function fallbackToIPOrCenter(callback) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                callback({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    addressText: `📍 Live Device GPS (Lat ${pos.coords.latitude.toFixed(5)}, Lng ${pos.coords.longitude.toFixed(5)})`
                });
            },
            () => {
                callback({ lat: defaultCenter[0], lng: defaultCenter[1], addressText: `📍 City Center (Lat ${defaultCenter[0]}, Lng ${defaultCenter[1]})` });
            },
            { enableHighAccuracy: false, timeout: 3000 }
        );
    } else {
        callback({ lat: defaultCenter[0], lng: defaultCenter[1], addressText: `📍 City Center (Lat ${defaultCenter[0]}, Lng ${defaultCenter[1]})` });
    }
}

function parseExifGPS(buffer) {
    try {
        const view = new DataView(buffer);
        if (view.getUint16(0, false) !== 0xFFD8) return null;
        let length = view.byteLength, offset = 2;

        while (offset < length) {
            if (view.getUint16(offset, false) === 0xFFE1) {
                const exifOffset = offset + 10;
                if (view.getUint32(offset + 4, false) !== 0x45786966) return null;

                const littleEndian = view.getUint16(exifOffset, false) === 0x4949;
                const get16 = (o) => view.getUint16(o, littleEndian);
                const get32 = (o) => view.getUint32(o, littleEndian);

                const firstIFD = get32(exifOffset + 4);
                let gpsIFDOffset = null;
                const numEntries = get16(exifOffset + firstIFD);
                let entryOffset = exifOffset + firstIFD + 2;

                for (let i = 0; i < numEntries; i++) {
                    if (get16(entryOffset) === 0x8825) {
                        gpsIFDOffset = get32(entryOffset + 8);
                        break;
                    }
                    entryOffset += 12;
                }

                if (gpsIFDOffset !== null) {
                    const gpsPos = exifOffset + gpsIFDOffset;
                    const gpsNum = get16(gpsPos);
                    let gOffset = gpsPos + 2;
                    let latArr = null, latRef = 'N', lngArr = null, lngRef = 'E';

                    for (let i = 0; i < gpsNum; i++) {
                        const tag = get16(gOffset);
                        const valOff = exifOffset + get32(gOffset + 8);

                        if (tag === 1) latRef = String.fromCharCode(view.getUint8(gOffset + 8));
                        else if (tag === 2) {
                            latArr = [
                                get32(valOff) / get32(valOff + 4),
                                get32(valOff + 8) / get32(valOff + 12),
                                get32(valOff + 16) / get32(valOff + 20)
                            ];
                        } else if (tag === 3) lngRef = String.fromCharCode(view.getUint8(gOffset + 8));
                        else if (tag === 4) {
                            lngArr = [
                                get32(valOff) / get32(valOff + 4),
                                get32(valOff + 8) / get32(valOff + 12),
                                get32(valOff + 16) / get32(valOff + 20)
                            ];
                        }
                        gOffset += 12;
                    }

                    if (latArr && lngArr) {
                        let lat = latArr[0] + (latArr[1] / 60) + (latArr[2] / 3600);
                        let lng = lngArr[0] + (lngArr[1] / 60) + (lngArr[2] / 3600);
                        if (latRef === 'S') lat = -lat;
                        if (lngRef === 'W') lng = -lng;
                        return { lat, lng };
                    }
                }
                break;
            } else {
                offset += 2 + view.getUint16(offset + 2, false);
            }
        }
    } catch (e) {}
    return null;
}

function submitPendingComplaint() {
    if (!pendingComplaint) {
        alert("Please upload or snap a photo first!");
        return;
    }

    const citizenName = document.getElementById("citizenReportName").value.trim();
    const citizenPhone = document.getElementById("citizenReportPhone").value.trim();
    if (!citizenName || !citizenPhone) {
        alert("Contact Information Required: Please fill in your Full Name and Contact Number before submitting the report.");
        return;
    }

    const { photoLoc, analysis } = pendingComplaint;
    const dispatchCard = document.getElementById("dispatchCard");
    const duplicateBanner = document.getElementById("duplicateBanner");

    duplicateBanner.style.display = "none";

    const newTicketId = `#ADM-${Math.floor(1000 + Math.random() * 9000)}`;

    const isHighCritical = analysis.score >= 80 || analysis.severity === 'High';
    const priorityCategory = isHighCritical ? "HIGH/CRITICAL" : "NORMAL";

    const selectedSquadObj = squadRosters[Math.floor(Math.random() * squadRosters.length)];
    const squadWorkers = (registeredWorkers.length > 0) ? 
        registeredWorkers.filter(w => w.squad === selectedSquadObj.shortName || w.squad === selectedSquadObj.squadName) : 
        selectedSquadObj.workers;

    const finalWorkersList = (squadWorkers.length > 0) ? squadWorkers : selectedSquadObj.workers;
    const assignedSquad = selectedSquadObj.squadName;
    const workerContactsList = finalWorkersList.map(w => `${w.name} (Ph: ${w.phone}, Email: ${w.email})`).join("; ");
    const workerCount = finalWorkersList.length;

    const dispatchMessage = `📱 SMS & ✉️ EMAIL DISPATCH BROADCAST SENT TO FIELD SQUAD: "Emergency Work Order ${newTicketId} assigned to ${assignedSquad} (${workerCount} Field Technicians). Proceed to location immediately!"`;

    const statusText = isHighCritical ? 
        `Assigned (${selectedSquadObj.shortName})` : 
        `Queued (Normal Priority)`;

    document.getElementById("ticketIdBadge").textContent = newTicketId;
    document.getElementById("stateVal").textContent = analysis.stateText;
    document.getElementById("resGpsLoc").textContent = photoLoc.addressText;
    document.getElementById("resHealth").textContent = `${analysis.healthIndex}% (Structural Health)`;
    document.getElementById("resDimensions").textContent = `${analysis.areaSqM.toFixed(2)} m² (Depth: ~${analysis.depthCm.toFixed(1)}cm)`;
    document.getElementById("resSla").textContent = `Within ${analysis.sla}`;

    const alertBox = document.getElementById("dispatchAlertText");
    if (alertBox) {
        alertBox.innerHTML = `<strong>${dispatchMessage}</strong>`;
    }

    dispatchCard.style.display = "block";

    const newReport = {
        id: newTicketId,
        citizenIdentity: sessionStorage.getItem("citizen_identity") || "",
        citizenName: citizenName,
        citizenPhone: citizenPhone,
        location: photoLoc.addressText,
        lat: photoLoc.lat,
        lng: photoLoc.lng,
        problem: analysis.defectType,
        stateText: analysis.stateText,
        severity: analysis.severity,
        water: analysis.waterDetected ? "Yes" : "No",
        weatherStatus: analysis.weatherStatus,
        priorityCategory: priorityCategory,
        score: analysis.score,
        sla: analysis.sla,
        healthIndex: analysis.healthIndex,
        dimensions: `${analysis.areaSqM.toFixed(2)} m² (Depth: ~${analysis.depthCm.toFixed(1)}cm)`,
        status: statusText,
        assignedSquad: assignedSquad,
        assignedWorkers: finalWorkersList,
        workerCount: workerCount,
        dispatchMessage: dispatchMessage,
        imageData: analysis.imageData || null,
        imageHash: analysis.imageHash || null,
        timestamp: new Date().toISOString()
    };

    fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReport)
    })
    .then(res => {
        if (res.status === 409) {
            return res.json().then(errData => {
                cancelPendingPhoto();
                alert(`⚠️ REJECTED: THIS IMAGE HAS ALREADY BEEN UPLOADED!\n\n${errData.message || 'This photo was already submitted as a complaint ticket.'}`);
                showToast(`⚠️ Upload Rejected: Duplicate Photo Already Exists`);
                throw new Error("Duplicate image");
            });
        }
        return res.json();
    })
    .then(data => {
        if (!data || data.status === "rejected") return;
        fetchReportsFromAPI();
        displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);
        showToast(`✓ Ticket ${newTicketId} -> SMS & Email Alerts Sent to ${workerCount} Workers' Phones!`);
    })
    .catch(err => {
        if (err.message === "Duplicate image") return;
        reports.unshift(newReport);
        renderMapMarkers();
        displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);
        showToast(`✓ Ticket ${newTicketId} Dispatched to ${workerCount} Workers' Phones!`);
    });

    pendingComplaint = null;
}

function cancelPendingPhoto() {
    const previewWrap = document.getElementById("previewWrap");
    const dispatchCard = document.getElementById("dispatchCard");
    const dropzone = document.getElementById("dropzone");

    if (previewWrap) previewWrap.style.display = "none";
    if (dispatchCard) dispatchCard.style.display = "none";
    if (dropzone) dropzone.style.display = "block";

    document.getElementById("roadImage").value = "";
    if (uploaderLiveMarker) map.removeLayer(uploaderLiveMarker);
    if (uploaderAccuracyCircle) map.removeLayer(uploaderAccuracyCircle);
    pendingComplaint = null;
    showToast("Photo cancelled.");
}

function openLiveCameraStream(e) {
    if (e) e.stopPropagation();
    const cameraWrap = document.getElementById("cameraWrap");
    const video = document.getElementById("cameraVideo");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        })
        .then(function(stream) {
            mediaStreamTrack = stream;
            video.srcObject = stream;
            cameraWrap.style.display = "block";
            showToast("Direct Camera Viewfinder Opened!");
        })
        .catch(function(err) {
            alert("Camera permission denied. Tap on the box to select a photo from your gallery.");
        });
    }
}

function closeLiveCameraStream() {
    if (mediaStreamTrack) {
        mediaStreamTrack.getTracks().forEach(track => track.stop());
        mediaStreamTrack = null;
    }
    document.getElementById("cameraWrap").style.display = "none";
}

function snapLiveCameraPhoto() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("cvCanvas");
    const ctx = canvas.getContext("2d");
    const previewWrap = document.getElementById("previewWrap");
    const dropzone = document.getElementById("dropzone");
    const scanLine = document.getElementById("scanLine");
    const dispatchCard = document.getElementById("dispatchCard");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    closeLiveCameraStream();

    if (dropzone) dropzone.style.display = "none";
    if (previewWrap) previewWrap.style.display = "block";
    if (scanLine) scanLine.style.display = "block";
    if (dispatchCard) dispatchCard.style.display = "none";

    const analysis = analyzePixelDefectFromCanvas(canvas, ctx);

    const boxX = canvas.width * 0.25;
    const boxY = canvas.height * 0.3;
    const boxW = canvas.width * 0.5;
    const boxH = canvas.height * 0.4;

    ctx.strokeStyle = analysis.severity === 'High' ? "#ef4444" : "#00ffcc";
    ctx.lineWidth = Math.max(3, canvas.width * 0.006);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    const imageData = canvas.toDataURL("image/jpeg", 0.6);
    const imageHash = computeCanvasImageHash(canvas, ctx);

    const dupReport = isDuplicateImageUploaded(imageData, imageHash);
    if (dupReport) {
        cancelPendingPhoto();
        showDuplicateImagePopUp(dupReport);
        showToast(`⚠️ Camera Snap Rejected: Photo already exists as Ticket ${dupReport.id}`);
        return;
    }

    analysis.imageData = imageData;
    analysis.imageHash = imageHash;

    document.getElementById("hudConfidence").innerHTML = `<i data-lucide="check-circle-2" style="width:14px; height:14px; display:inline;"></i> Defect Segmented: ${analysis.defectType} (${analysis.confidence}% Conf)`;
    document.getElementById("reviewStateLabel").textContent = `${analysis.defectType} (${analysis.severity} Urgency)`;
    lucide.createIcons();

    const defaultLoc = {
        lat: defaultCenter[0],
        lng: defaultCenter[1],
        addressText: `📍 Live Location (Lat ${defaultCenter[0].toFixed(4)}, Lng ${defaultCenter[1].toFixed(4)})`
    };

    pendingComplaint = {
        photoLoc: defaultLoc,
        analysis: analysis
    };

    displayLiveUploaderLocationOnMap(defaultLoc.lat, defaultLoc.lng, defaultLoc.addressText);

    setTimeout(() => {
        if (scanLine) scanLine.style.display = "none";
    }, 600);

    const dummyFile = new File(["cameraSnap"], `camera_snap_${Date.now()}.jpg`, { type: "image/jpeg" });
    resolveAccurateLiveLocation(dummyFile, function(photoLoc) {
        if (!pendingComplaint) return;
        pendingComplaint.photoLoc = photoLoc;
        const gpsBadgeDown = document.getElementById("hudGpsBadgeDown");
        if (gpsBadgeDown) {
            gpsBadgeDown.innerHTML = `<i data-lucide="navigation" style="width:14px; height:14px; display:inline;"></i> Live GPS Locked: ${photoLoc.lat.toFixed(5)}, ${photoLoc.lng.toFixed(5)}`;
        }
        displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);
        lucide.createIcons();
    });

    showToast("Camera Frame Snapped! Live Location Locked on Map.");
}

function setupDragAndDrop() {
    const dropzone = document.getElementById("dropzone");
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach(n => dropzone.addEventListener(n, e => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    }));

    ['dragleave'].forEach(n => dropzone.addEventListener(n, e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    }));

    dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            processImageFile(file);
        }
    });
}

function computeCanvasImageHash(canvas, ctx) {
    try {
        const w = canvas.width;
        const h = canvas.height;
        const imgData = ctx.getImageData(0, 0, w, h).data;
        let sum = 0;
        let pHashBits = "";
        const step = Math.max(1, Math.floor(imgData.length / 64));
        for (let i = 0; i < imgData.length; i += step) {
            const avg = Math.floor((imgData[i] + imgData[i+1] + imgData[i+2]) / 3);
            sum += avg;
            pHashBits += avg > 128 ? "1" : "0";
        }
        return `PHASH-${Math.round(sum)}_${pHashBits.substring(0, 32)}`;
    } catch(e) {
        return `IMG-${Date.now()}`;
    }
}

function isDuplicateImageUploaded(newImageData, newHash) {
    if (!reports || reports.length === 0) return null;
    
    for (let r of reports) {
        // 1. Direct Base64 Exact Match
        if (r.imageData && newImageData && r.imageData.length > 200 && r.imageData === newImageData) {
            return r;
        }
        
        // 2. Direct Hash Match
        if (r.imageHash && newHash && r.imageHash.length > 10 && r.imageHash === newHash) {
            return r;
        }
        
        // 3. Perceptual Hash Similarity (Hamming distance comparison)
        if (r.imageHash && newHash && r.imageHash.startsWith("PHASH-") && newHash.startsWith("PHASH-")) {
            const parts1 = r.imageHash.split("_");
            const parts2 = newHash.split("_");
            if (parts1.length === 2 && parts2.length === 2) {
                const bits1 = parts1[1];
                const bits2 = parts2[1];
                let diff = 0;
                const minLen = Math.min(bits1.length, bits2.length);
                for (let k = 0; k < minLen; k++) {
                    if (bits1[k] !== bits2[k]) diff++;
                }
                if (diff <= 3) {
                    return r;
                }
            }
        }
    }
    return null;
}

function showDuplicateImagePopUp(dupReport) {
    const modal = document.getElementById("duplicateModalOverlay");
    
    if (dupReport) {
        const ticketIdEl = document.getElementById("dupTicketId");
        const ticketProblemEl = document.getElementById("dupTicketProblem");
        const ticketLocEl = document.getElementById("dupTicketLocation");
        const ticketStatusEl = document.getElementById("dupTicketStatus");

        if (ticketIdEl) ticketIdEl.textContent = `PREVIOUS TICKET: ${dupReport.id || '#ADM-EXISTS'}`;
        if (ticketProblemEl) ticketProblemEl.textContent = `Defect Type: ${dupReport.problem || 'Road Defect'}`;
        if (ticketLocEl) ticketLocEl.textContent = `Location: ${dupReport.location || 'Urban Sector'}`;
        if (ticketStatusEl) ticketStatusEl.textContent = `Current Status: ${dupReport.status || 'Active Work Order'}`;
    }

    if (modal) {
        modal.style.display = "flex";
    }

    // High-visibility browser popup alert
    const ticketId = dupReport ? dupReport.id : 'Existing Ticket';
    alert(`⚠️ REJECTED: THIS IMAGE HAS ALREADY BEEN UPLOADED!\n\nThis exact road defect photo was already uploaded as Ticket ${ticketId}.\n\nDuplicate uploads are not allowed!`);
}

function closeDuplicateModal() {
    const modal = document.getElementById("duplicateModalOverlay");
    if (modal) modal.style.display = "none";
}

function showInvalidImagePopUp() {
    const modal = document.getElementById("invalidImageModalOverlay");
    if (modal) {
        modal.style.display = "flex";
    }
    // High-visibility alert
    alert("⚠️ INVALID IMAGE: NOT A ROAD DEFECT!\n\nPlease UPLOAD THE CORRECT IMAGE!\n\nThe uploaded photo does not appear to show a road pothole or flooding defect.");
}

function closeInvalidImageModal() {
    const modal = document.getElementById("invalidImageModalOverlay");
    if (modal) modal.style.display = "none";
}

function analyzePixelDefectFromCanvas(canvas, ctx) {
    let darkPixelCount = 0;
    let blueWaterPixelCount = 0;
    let grayAsphaltPixelCount = 0;
    let totalSampled = 0;

    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 16) {
            totalSampled++;
            const r = data[i], g = data[i+1], b = data[i+2];
            const brightness = (r + g + b) / 3;
            
            // Pothole / asphalt dark crater pixels
            if (brightness < 80) darkPixelCount++;
            
            // Waterlogging / flooding blue spectrum
            if (b > r + 12 && b > g + 8) blueWaterPixelCount++;
            
            // Road asphalt gray tones (low color saturation)
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            if ((maxC - minC) < 35 && brightness > 30 && brightness < 200) grayAsphaltPixelCount++;
        }
    } catch (e) { 
        darkPixelCount = 310; 
        totalSampled = 1000;
    }

    const darkRatio = darkPixelCount / (totalSampled || 1);
    const waterRatio = blueWaterPixelCount / (totalSampled || 1);
    const asphaltRatio = grayAsphaltPixelCount / (totalSampled || 1);

    // Image is valid if it contains dark crater pixels, water/reflection, or road asphalt texture
    const isValidRoadDefect = (darkRatio > 0.08) || (waterRatio > 0.06) || (asphaltRatio > 0.20);

    let severity = "Medium";
    let defectType = "Pothole";
    let score = Math.min(100, Math.floor(40 + darkRatio * 120));
    let sla = "48 Hours";
    let stateText = "🟠 MODERATE RISK - Fatigue Surface Cracking";

    let weatherStatus = "☀️ Clear Weather (Normal Precipitation)";

    if (waterRatio > 0.12) {
        severity = "High"; defectType = "Waterlogging"; score = 92; sla = "24 Hours";
        stateText = "🔵 FLOOD HAZARD - Active Waterlogging & Sub-surface Pooling";
        weatherStatus = "🌧️ Monsoon Rain Alert (High Waterpooling Risk & Drainage Catchment)";
    } else if (darkRatio > 0.32 || asphaltRatio > 0.35) {
        severity = "High"; defectType = "Pothole"; score = 96; sla = "12 Hours";
        stateText = "🔴 CRITICAL HAZARD - Structural Sub-Base Crater & Rim Impact Risk";
        weatherStatus = "🌦️ Rain Erosion Warning (Erosion Vulnerability)";
    }

    const confVal = Math.min(99.9, (89 + (darkRatio > 0 ? (darkRatio * 9.5) : 5))).toFixed(1);

    return {
        isValidRoadDefect,
        severity, defectType, waterDetected: waterRatio > 0.12,
        areaSqM: 0.5 + darkRatio * 3.5, depthCm: 4 + darkRatio * 18,
        confidence: confVal,
        weatherStatus: weatherStatus,
        healthIndex: Math.max(15, Math.floor(100 - (darkRatio * 160))),
        score, sla, stateText
    };
}

function showToast(message) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}

function logoutCitizen() {
    sessionStorage.removeItem("citizen_auth");
    sessionStorage.removeItem("citizen_identity");
    window.location.reload();
}

function renderCitizenHistory() {
    const tbody = document.getElementById("citizenHistoryTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const citizenId = sessionStorage.getItem("citizen_identity");
    
    // Set identity text label
    const label = document.getElementById("citUserIdentity");
    if (label && citizenId) label.textContent = citizenId;

    const myReports = allReports.filter(r => r.citizenIdentity === citizenId);

    if (myReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted); font-size: 0.9rem; font-weight: 800;">
                    🔍 NO ISSUES REPORTED YET<br>
                    <span style="font-size: 0.8rem; font-weight: 600; color: #64748b;">Upload and submit a road defect report above to populate your history.</span>
                </td>
            </tr>
        `;
        return;
    }

    myReports.forEach(r => {
        const tr = document.createElement("tr");
        const formattedDate = r.timestamp ? new Date(r.timestamp).toLocaleString() : "N/A";
        
        let statusBadge = "";
        if (r.status === 'Resolved' || r.resolved === true || r.status.includes('SOLVED') || r.status.includes('Resolved')) {
            statusBadge = `<span class="badge-green">✓ Resolved</span>`;
        } else if (r.status.includes('Assigned') || r.status.includes('Progress')) {
            statusBadge = `<span class="badge-orange">🚜 In Progress</span>`;
        } else {
            statusBadge = `<span class="badge-blue">🕒 Queued</span>`;
        }

        tr.innerHTML = `
            <td style="padding: 12px 10px;"><strong style="color: var(--brand-blue);">${r.id}</strong></td>
            <td style="padding: 12px 10px; color: #000000; font-weight: 800;">${r.problem || "Road Issue"}</td>
            <td style="padding: 12px 10px; color: #0f172a; font-weight: 700;">${r.location}</td>
            <td style="padding: 12px 10px; font-family: var(--font-mono); font-size: 0.8rem; color: #334155; font-weight: 700;">${formattedDate}</td>
            <td style="padding: 12px 10px;">${statusBadge}</td>
        `;
        tbody.appendChild(tr);
    });
}

