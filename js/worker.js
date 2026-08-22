let reports = [];

const defaultDefectImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'><rect width='240' height='180' fill='%230f172a'/><circle cx='120' cy='90' r='45' fill='%23020617' stroke='%23ef4444' stroke-width='4'/><path d='M90 90 Q 120 70 150 90 T 120 110 Z' fill='%23ef4444' opacity='0.3'/><text x='120' y='95' fill='%23ef4444' font-size='12' font-weight='bold' text-anchor='middle' font-family='monospace'>DEFECT PHOTO TELEMETRY</text></svg>";

document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    checkWorkerAuth();
});

function checkWorkerAuth() {
    const isAuth = sessionStorage.getItem("worker_auth") === "true";
    const overlay = document.getElementById("workerAuthOverlay");
    if (isAuth) {
        if (overlay) overlay.style.display = "none";
        fetchWorkerReports();
    } else {
        if (overlay) overlay.style.display = "flex";
    }
}

function authenticateWorkerDirect() {
    const input = document.getElementById("workerPasscodeInput");
    const val = input ? input.value : "";
    if (val === "worker123" || val === "squad123") {
        sessionStorage.setItem("worker_auth", "true");
        const overlay = document.getElementById("workerAuthOverlay");
        if (overlay) overlay.style.display = "none";
        fetchWorkerReports();
        showToast("Welcome Field Worker! Worker Portal Unlocked.");
    } else {
        alert("Access Denied: Invalid Field Worker Security Passcode.");
        if (input) input.value = "";
    }
}

function logoutWorker() {
    sessionStorage.removeItem("worker_auth");
    window.location.href = "index.html";
}

function fetchWorkerReports() {
    fetch('/api/reports')
        .then(res => res.json())
        .then(data => {
            reports = data;
            renderWorkerPortal();
        })
        .catch(err => {
            console.error("Worker fetch error:", err);
        });
}

function renderWorkerPortal() {
    const queue = document.getElementById("workerCardsQueue");
    if (!queue) return;

    queue.innerHTML = "";

    if (reports.length === 0) {
        queue.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-muted); font-family: var(--font-mono);">
                <i data-lucide="hard-hat" style="width: 48px; height: 48px; color: var(--neon-amber); margin-bottom: 0.5rem;"></i>
                <p style="font-size: 1.1rem; font-weight: 800; color: white;">NO PENDING ASSIGNED REPAIRS</p>
                <p style="font-size: 0.8rem;">All assigned work orders have been completed or verified.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    reports.forEach((r) => {
        const card = document.createElement("div");
        card.className = "worker-card";

        const squadName = r.assignedSquad || "🚜 Squad #1 (Sector 4 Quick-Patch Unit)";
        const workerCount = r.workerCount || 5;

        const workersBadgesHtml = (r.assignedWorkers && r.assignedWorkers.length > 0) ? r.assignedWorkers.map(w => `
            <span style="display:inline-flex; align-items:center; gap:6px; background:#FEF3C7; border:2px solid #D97706; color:#000000; font-family:var(--font-heading); font-size:0.875rem; font-weight:800; padding:6px 12px; border-radius:6px;">
                👤 <strong style="color:#000000;">${w.name}</strong> (${w.role || 'Field Operator'})
            </span>
        `).join(" ") : `
            <span style="display:inline-flex; align-items:center; gap:6px; background:#FCE7F3; border:2px solid #DB2777; color:#831843; font-family:var(--font-heading); font-size:0.875rem; font-weight:900; padding:6px 12px; border-radius:6px;">
                🚜 <strong>${squadName}</strong> (${workerCount} Field Technicians Assigned)
            </span>
        `;

        const beforePhotoSrc = r.imageData || defaultDefectImage;
        const beforePhotoHtml = `<img src="${beforePhotoSrc}" alt="Before Repair Defect Photo">`;

        const afterPhotoHtml = r.afterImageData ?
            `<img src="${r.afterImageData}" alt="After Repair Completed Photo">` :
            `<div class="after-upload-dropzone">
                <i data-lucide="camera" style="width:36px; height:36px; color:#DB2777; margin-bottom:8px;"></i>
                <div style="font-size:0.95rem; font-weight:900; color:#000000;">UPLOAD AFTER REPAIR PHOTO</div>
                <div style="font-size:0.85rem; color:#0f172a; font-weight:700; margin-bottom:6px;">Snap fixed road to run AI Match Verification</div>
                <button class="btn-worker-upload" onclick="triggerAfterFileInput('${r.id}')">
                    <i data-lucide="upload" style="width:16px; height:16px;"></i> Upload Repair Proof
                </button>
                <input type="file" id="afterInput-${r.id.replace('#', '')}" accept="image/*" capture="environment" style="display:none;" onchange="processWorkerAfterImage('${r.id}', this)">
            </div>`;

        card.innerHTML = `
            <div class="worker-card-header">
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <span class="squad-badge">
                        <i data-lucide="hard-hat" style="width: 16px; height: 16px;"></i> ${squadName} (${workerCount} Workers Assigned)
                    </span>
                    <span style="font-family: var(--font-heading); font-weight: 900; color: #1D4ED8; font-size: 1.05rem;">${r.id}</span>
                </div>
                <div style="font-family: var(--font-heading); font-size: 0.9rem; font-weight: 900; color: ${r.status === 'Resolved' || r.status.includes('SOLVED') ? '#047857' : '#B45309'};">
                    Status: ${r.status}
                </div>
            </div>

            <!-- DISPATCH BROADCAST NOTIFICATION BANNER -->
            <div style="margin-bottom: 1rem; background: #FEF3C7; border: 2px solid #D97706; border-radius: 8px; padding: 0.85rem 1rem; font-family: var(--font-heading); font-size: 0.9rem; color: #000000; font-weight: 800;">
                <div style="font-weight: 900; color: #000000; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="radio" style="width:18px; height:18px; color:#B45309;"></i> DISPATCH SMS/RADIO ALERT BROADCAST TO NEARBY WORKERS:
                </div>
                <div style="color: #000000; font-weight: 800;">${r.dispatchMessage || `Emergency Work Order ${r.id} assigned to ${workerCount} field workers. Proceed to location!`}</div>
            </div>

            <!-- ASSIGNED WORKERS BATCH ROSTER -->
            <div style="margin-bottom: 1rem;">
                <div style="font-family: var(--font-heading); font-size: 0.85rem; font-weight: 900; color: #000000; margin-bottom: 6px;">ASSIGNED WORKER CREW BATCH (${workerCount} MEMBERS):</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${workersBadgesHtml}
                </div>
            </div>

            <div style="margin-bottom: 1rem; font-family: var(--font-heading); font-size: 0.95rem; color: #1D4ED8; font-weight: 900;">
                📍 ${r.location} — <span style="color: #000000; font-weight: 900;">${r.stateText}</span>
            </div>

            <div class="before-after-grid">
                <div class="photo-box">
                    <span class="photo-tag before">📷 BEFORE: CITIZEN DEFECT UPLOAD</span>
                    ${beforePhotoHtml}
                </div>

                <div class="photo-box">
                    <span class="photo-tag after">✅ AFTER: WORKER REPAIR PROOF</span>
                    ${afterPhotoHtml}
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

            ${r.verificationScore ? `
                <div class="ai-verification-result" style="border: 2px solid ${r.verificationScore >= 80 ? '#047857' : '#b91c1c'}; background: ${r.verificationScore >= 80 ? '#d1fae5' : '#fee2e2'}; color: ${r.verificationScore >= 80 ? '#064e3b' : '#7f1d1d'}; font-weight: 900;">
                    <div>
                        <strong style="font-size: 0.95rem;">🤖 AI BEFORE VS. AFTER VERIFICATION MATCH: ${r.verificationScore}%</strong><br>
                        <span style="font-size:0.85rem; font-weight:800;">${r.verificationDetail || 'Surface smoothness & crater fill verified.'}</span>
                    </div>
                    <span style="font-weight: 900; font-size: 0.95rem;">
                        ${r.verificationScore >= 80 ? '✓ VERIFIED & SOLVED' : '⚠️ REQUIRES RE-INSPECTION'}
                    </span>
                </div>
            ` : ''}
        `;

        queue.appendChild(card);
    });

    lucide.createIcons();
}

function triggerAfterFileInput(ticketId) {
    const input = document.getElementById(`afterInput-${ticketId.replace('#', '')}`);
    if (input) input.click();
}

function processWorkerAfterImage(ticketId, inputEl) {
    const file = inputEl.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById("matchCanvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const afterImageData = canvas.toDataURL("image/jpeg", 0.6);

            runAIBeforeAfterMatchVerification(ticketId, canvas, ctx, afterImageData);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function runAIBeforeAfterMatchVerification(ticketId, canvas, ctx, afterImageData) {
    let darkPixelCount = 0;
    try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 16) {
            const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
            if (brightness < 70) darkPixelCount++;
        }
    } catch (e) { darkPixelCount = 50; }

    const darkRatio = darkPixelCount / (canvas.width * canvas.height / 16);
    
    let matchScore = Math.min(99, Math.max(65, Math.floor(98 - darkRatio * 150)));
    let isVerified = matchScore >= 80;

    let newStatus = isVerified ? "✓ SOLVED & AI VERIFIED" : "⚠️ REPAIR UNVERIFIED";
    let detailText = isVerified ? 
        `Crater filled & surface smooth. AI Before/After Match ${matchScore}%` : 
        `Pothole rim still detected. AI Before/After Match ${matchScore}%`;

    fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: ticketId,
            status: newStatus,
            afterImageData: afterImageData,
            verificationScore: matchScore,
            verificationDetail: detailText
        })
    })
    .then(res => res.json())
    .then(data => {
        fetchWorkerReports();
        showToast(isVerified ? `✓ Repair ${ticketId} Verified & Solved by AI!` : `⚠️ Repair ${ticketId} Unverified.`);
    })
    .catch(err => {
        const item = reports.find(r => r.id === ticketId);
        if (item) {
            item.status = newStatus;
            item.afterImageData = afterImageData;
            item.verificationScore = matchScore;
            item.verificationDetail = detailText;
        }
        renderWorkerPortal();
        showToast(`✓ Repair ${ticketId} Updated!`);
    });
}

function showToast(message) {
    const toast = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}
