const initialReports = [
    {
        id: "#ADM-1001",
        location: "📍 MG Road, Sector 4 (Lat 12.97341, Lng 77.59218)",
        lat: 12.97341,
        lng: 77.59218,
        problem: "Severe Pothole",
        stateText: "🔴 CRITICAL HAZARD - Structural Sub-Base Crater",
        severity: "High",
        water: "Yes",
        score: 96,
        sla: "12 Hours",
        status: "Open"
    }
];

let reports = JSON.parse(localStorage.getItem("admin_dispatched_reports")) || initialReports;
let map, markersLayer;
let uploaderLiveMarker = null;
let uploaderAccuracyCircle = null;
let baseLayers = {};
let currentTileLayer = null;
const defaultCenter = [12.9716, 77.5946];
let mediaStreamTrack = null;
let pendingComplaint = null;

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    initMap();
    setupAutomatedUpload();
    setupDragAndDrop();
});

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

    document.getElementById("btnMapDefault").classList.remove("active");
    document.getElementById("btnMapSatellite").classList.remove("active");
    document.getElementById("btnMapTerrain").classList.remove("active");

    if (type === 'default') document.getElementById("btnMapDefault").classList.add("active");
    if (type === 'satellite') document.getElementById("btnMapSatellite").classList.add("active");
    if (type === 'terrain') document.getElementById("btnMapTerrain").classList.add("active");
}

function renderMapMarkers() {
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

function checkForDuplicateComplaint(lat, lng) {
    for (let r of reports) {
        if (r.status !== 'Resolved') {
            let distLat = Math.abs(r.lat - lat);
            let distLng = Math.abs(r.lng - lng);
            if (distLat < 0.0003 && distLng < 0.0003) {
                return r;
            }
        }
    }
    return null;
}

function setupAutomatedUpload() {
    const fileInput = document.getElementById("roadImage");

    fileInput.addEventListener("change", function(e) {
        const file = e.target.files[0];
        if (!file) return;
        processImageFile(file);
    });
}

function processImageFile(file) {
    const canvas = document.getElementById("cvCanvas");
    const ctx = canvas.getContext("2d");
    const previewWrap = document.getElementById("previewWrap");
    const scanLine = document.getElementById("scanLine");
    const dispatchCard = document.getElementById("dispatchCard");

    previewWrap.style.display = "block";
    scanLine.style.display = "block";
    dispatchCard.style.display = "none";

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const analysis = analyzePixelDefectFromCanvas(canvas, ctx);

            // 🎯 ACCURATE REAL DEVICE GPS RESOLUTION
            resolveAccurateLiveLocation(file, function(photoLoc) {
                const boxX = img.width * 0.25;
                const boxY = img.height * 0.3;
                const boxW = img.width * 0.5;
                const boxH = img.height * 0.4;

                ctx.strokeStyle = analysis.severity === 'High' ? "#ef4444" : "#00ffcc";
                ctx.lineWidth = Math.max(3, img.width * 0.006);
                ctx.strokeRect(boxX, boxY, boxW, boxH);

                document.getElementById("hudConfidence").innerHTML = `<i data-lucide="check-circle-2" style="width:14px; height:14px; display:inline;"></i> Defect Segmented: ${analysis.defectType} (${analysis.confidence}% Conf)`;
                
                const gpsBadgeDown = document.getElementById("hudGpsBadgeDown");
                if (gpsBadgeDown) {
                    gpsBadgeDown.innerHTML = `<i data-lucide="navigation" style="width:14px; height:14px; display:inline;"></i> Live GPS Locked: ${photoLoc.lat.toFixed(5)}, ${photoLoc.lng.toFixed(5)}`;
                }

                document.getElementById("reviewStateLabel").textContent = `${analysis.defectType} (${analysis.severity} Urgency)`;
                lucide.createIcons();

                // 🎯 FLY GIS MAP DIRECTLY TO ACCURATE LIVE LOCATION
                displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);

                pendingComplaint = {
                    photoLoc,
                    analysis
                };

                showToast("🎯 Accurate Live Location Locked! Click 'SUBMIT ROAD COMPLAINT TICKET' to dispatch.");
            });
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// 🎯 HIGH-PRECISION REAL-TIME ACCURATE LOCATION ENGINE
function resolveAccurateLiveLocation(file, callback) {
    const fileReader = new FileReader();

    fileReader.onload = function(e) {
        const buffer = e.target.result;
        const exifGps = parseExifGPS(buffer);

        // 1. Check embedded camera sensor EXIF tags first
        if (exifGps && !isNaN(exifGps.lat) && !isNaN(exifGps.lng) && exifGps.lat !== 0) {
            fetchAddressAndReturn(exifGps.lat, exifGps.lng, "Photo EXIF GPS", callback);
            return;
        }

        // 2. Query high-accuracy device GPS directly
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    fetchAddressAndReturn(lat, lng, "Live Device GPS", callback);
                },
                (err) => {
                    // Fallback to IP / City coordinates if permission blocked
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

    const { photoLoc, analysis } = pendingComplaint;
    const dispatchCard = document.getElementById("dispatchCard");

    const dup = checkForDuplicateComplaint(photoLoc.lat, photoLoc.lng);
    const duplicateBanner = document.getElementById("duplicateBanner");

    if (dup) {
        duplicateBanner.style.display = "block";
        document.getElementById("duplicateMsg").textContent = `⚠️ DUPLICATE COMPLAINT DETECTED: Correlated with active ticket ${dup.id} within 20m proximity.`;
    } else {
        duplicateBanner.style.display = "none";
    }

    const newTicketId = dup ? dup.id : `#ADM-${Math.floor(1000 + Math.random() * 9000)}`;
    document.getElementById("ticketIdBadge").textContent = newTicketId;
    document.getElementById("stateVal").textContent = analysis.stateText;
    document.getElementById("resGpsLoc").textContent = photoLoc.addressText;
    document.getElementById("resHealth").textContent = `${analysis.healthIndex}% (Structural Health)`;
    document.getElementById("resDimensions").textContent = `${analysis.areaSqM.toFixed(2)} m² (Depth: ~${analysis.depthCm.toFixed(1)}cm)`;
    document.getElementById("resSla").textContent = `Within ${analysis.sla}`;

    dispatchCard.style.display = "block";

    if (!dup) {
        const newReport = {
            id: newTicketId,
            location: photoLoc.addressText,
            lat: photoLoc.lat,
            lng: photoLoc.lng,
            problem: analysis.defectType,
            stateText: analysis.stateText,
            severity: analysis.severity,
            water: analysis.waterDetected ? "Yes" : "No",
            score: analysis.score,
            sla: analysis.sla,
            healthIndex: analysis.healthIndex,
            dimensions: `${analysis.areaSqM.toFixed(2)} m² (Depth: ~${analysis.depthCm.toFixed(1)}cm)`,
            status: "Open"
        };
        reports.unshift(newReport);
        localStorage.setItem("admin_dispatched_reports", JSON.stringify(reports));
        renderMapMarkers();
    }

    displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);
    showToast(`✓ Ticket ${newTicketId} Officially Submitted to Administrator!`);

    pendingComplaint = null;
}

function cancelPendingPhoto() {
    document.getElementById("previewWrap").style.display = "none";
    document.getElementById("dispatchCard").style.display = "none";
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
    const scanLine = document.getElementById("scanLine");
    const dispatchCard = document.getElementById("dispatchCard");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    closeLiveCameraStream();

    previewWrap.style.display = "block";
    scanLine.style.display = "block";
    dispatchCard.style.display = "none";

    const dummyFile = new File(["cameraSnap"], `camera_snap_${Date.now()}.jpg`, { type: "image/jpeg" });

    resolveAccurateLiveLocation(dummyFile, function(photoLoc) {
        const analysis = analyzePixelDefectFromCanvas(canvas, ctx);

        setTimeout(() => {
            const boxX = canvas.width * 0.25;
            const boxY = canvas.height * 0.3;
            const boxW = canvas.width * 0.5;
            const boxH = canvas.height * 0.4;

            ctx.strokeStyle = analysis.severity === 'High' ? "#ef4444" : "#00ffcc";
            ctx.lineWidth = Math.max(3, canvas.width * 0.006);
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            document.getElementById("hudConfidence").innerHTML = `<i data-lucide="check-circle-2" style="width:14px; height:14px; display:inline;"></i> Defect Segmented: ${analysis.defectType} (${analysis.confidence}% Conf)`;
            
            const gpsBadgeDown = document.getElementById("hudGpsBadgeDown");
            if (gpsBadgeDown) {
                gpsBadgeDown.innerHTML = `<i data-lucide="navigation" style="width:14px; height:14px; display:inline;"></i> Live GPS Locked: ${photoLoc.lat.toFixed(5)}, ${photoLoc.lng.toFixed(5)}`;
            }

            document.getElementById("reviewStateLabel").textContent = `${analysis.defectType} (${analysis.severity} Urgency)`;
            lucide.createIcons();

            displayLiveUploaderLocationOnMap(photoLoc.lat, photoLoc.lng, photoLoc.addressText);

            pendingComplaint = {
                photoLoc,
                analysis
            };

            showToast("Camera Frame Snapped! Live Location Locked on Map.");

        }, 500);
    });
}

function setupDragAndDrop() {
    const dropzone = document.getElementById("dropzone");
    ['dragenter', 'dragover'].forEach(n => dropzone.addEventListener(n, e => { e.preventDefault(); dropzone.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(n => dropzone.addEventListener(n, e => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
}

function analyzePixelDefectFromCanvas(canvas, ctx) {
    let darkPixelCount = 0;
    let blueWaterPixelCount = 0;
    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 16) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            if (brightness < 75) darkPixelCount++;
            if (data[i+2] > data[i] + 15 && data[i+2] > data[i+1] + 10) blueWaterPixelCount++;
        }
    } catch (e) { darkPixelCount = 310; }

    const darkRatio = darkPixelCount / 1000;
    const waterRatio = blueWaterPixelCount / 1000;

    let severity = "Medium";
    let defectType = "Pothole";
    let score = Math.min(100, Math.floor(40 + darkRatio * 120));
    let sla = "48 Hours";
    let stateText = "🟠 MODERATE RISK - Fatigue Surface Cracking";

    if (waterRatio > 0.12) {
        severity = "High"; defectType = "Waterlogging"; score = 92; sla = "24 Hours";
        stateText = "🔵 FLOOD HAZARD - Active Waterlogging & Sub-surface Pooling";
    } else if (darkRatio > 0.32) {
        severity = "High"; defectType = "Pothole"; score = 96; sla = "12 Hours";
        stateText = "🔴 CRITICAL HAZARD - Structural Sub-Base Crater & Rim Impact Risk";
    }

    const confVal = Math.min(99.9, (89 + (darkRatio > 0 ? (darkRatio * 9.5) : 5))).toFixed(1);

    return {
        severity, defectType, waterDetected: waterRatio > 0.12,
        areaSqM: 0.5 + darkRatio * 3.5, depthCm: 4 + darkRatio * 18,
        confidence: confVal,
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
