import http.server
import socketserver
import json
import os
import urllib.parse
import math

PORT = 8000
DB_FILE = os.path.join(os.path.dirname(__file__), 'db', 'reports.json')
WORKERS_FILE = os.path.join(os.path.dirname(__file__), 'db', 'workers.json')

_reports_cache = None
_workers_cache = None

def load_reports():
    global _reports_cache
    if not os.path.exists(DB_FILE):
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        save_reports([])
        return []
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            _reports_cache = json.load(f)
            return _reports_cache
    except Exception as e:
        print(f"Error loading reports DB: {e}")
        return []

def save_reports(data):
    global _reports_cache
    _reports_cache = data
    os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

DEFAULT_WORKERS = [
    {
        "id": "SQUAD-1",
        "name": "Squad #1 (Sector 4 Quick-Patch)",
        "lead": "Marcus Vance",
        "phone": "+1 (555) 019-2834",
        "status": "Available",
        "assignedTickets": 0
    },
    {
        "id": "SQUAD-2",
        "name": "Squad #2 (North GIS Drainage Unit)",
        "lead": "Elena Rostova",
        "phone": "+1 (555) 014-9821",
        "status": "Available",
        "assignedTickets": 0
    },
    {
        "id": "SQUAD-3",
        "name": "Squad #3 (Heavy Asphalt Infrastructure)",
        "lead": "Devon Hayes",
        "phone": "+1 (555) 018-7742",
        "status": "Available",
        "assignedTickets": 0
    }
]

def load_workers():
    global _workers_cache
    if _workers_cache is not None:
        return _workers_cache
    if not os.path.exists(WORKERS_FILE):
        os.makedirs(os.path.dirname(WORKERS_FILE), exist_ok=True)
        save_workers(DEFAULT_WORKERS)
        return DEFAULT_WORKERS
    try:
        with open(WORKERS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if not data:
                save_workers(DEFAULT_WORKERS)
                return DEFAULT_WORKERS
            _workers_cache = data
            return data
    except Exception as e:
        print(f"Error loading workers DB: {e}")
        return DEFAULT_WORKERS

def save_workers(data):
    global _workers_cache
    _workers_cache = data
    os.makedirs(os.path.dirname(WORKERS_FILE), exist_ok=True)
    with open(WORKERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def calculate_proximity(lat1, lng1, lat2, lng2):
    try:
        R = 6371000
        phi1 = math.radians(float(lat1))
        phi2 = math.radians(float(lat2))
        delta_phi = math.radians(float(lat2) - float(lat1))
        delta_lambda = math.radians(float(lng2) - float(lng1))
        a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c
    except Exception:
        return 99999

def run_ai_automation_pipeline(report):
    reports = load_reports()
    workers = load_workers()
    
    lat = float(report.get('lat', 0))
    lng = float(report.get('lng', 0))
    problem = str(report.get('problem', '')).lower()
    severity = str(report.get('severity', '')).lower()

    duplicate_ticket = None
    for existing in reports:
        if existing.get('status') != 'Resolved' and 'SOLVED' not in str(existing.get('status')):
            e_lat = float(existing.get('lat', 0))
            e_lng = float(existing.get('lng', 0))
            dist = calculate_proximity(lat, lng, e_lat, e_lng)
            if dist < 35 and dist > 0.001:
                duplicate_ticket = existing
                break

    if duplicate_ticket:
        report['aiDuplicateSuppressed'] = True
        report['mergedWithId'] = duplicate_ticket['id']
        report['score'] = min(100, int(duplicate_ticket.get('score', 80)) + 10)
        report['stateText'] = f"⚡ AI CLUSTER MERGED with Ticket {duplicate_ticket['id']} (Proximity Match)"

    if workers and len(workers) > 0:
        if 'water' in problem or 'flood' in problem or report.get('water') == 'Yes':
            assigned_squad = next((w for w in workers if 'Drainage' in w.get('name', '') or 'Hydro' in w.get('name', '')), workers[0])
        elif 'high' in severity or 'crater' in problem or 'pothole' in problem:
            assigned_squad = next((w for w in workers if 'Asphalt' in w.get('name', '') or 'Heavy' in w.get('name', '')), workers[0])
        else:
            assigned_squad = workers[0]

        report['assignedSquad'] = assigned_squad.get('name', 'Squad #1')
        report['assignedWorkers'] = [
            {"name": assigned_squad.get('lead', 'Squad Lead'), "role": "Lead Engineer", "phone": assigned_squad.get('phone', '+1 (555) 019-2834')}
        ]

    if 'water' in problem or report.get('water') == 'Yes':
        report['aiTechnicalBrief'] = "AI HYDRO-ANALYSIS: Active surface waterpooling. Recommended action: Hydro-vacuum catchment basin + 12cm bituminous base course."
        report['aiMaterialsChecklist'] = "• 2.5 Tons Cold-Mix Bitumen\n• Catch-Basin Vacuum Truck\n• High-Pressure Sub-base Pump"
    else:
        report['aiTechnicalBrief'] = "AI CRATER SEGMENTATION: Structural sub-base cavity defect detected. Recommended action: Excavate 15cm cavity + compaction paving."
        report['aiMaterialsChecklist'] = "• 3.0 Tons Asphalt Concrete\n• Vibratory Plate Compactor\n• Tack Coat Adhesive Spray"

    return report

class FullStackRequestHandler(http.server.SimpleHTTPRequestHandler):

    def send_json(self, status_code, payload):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/' or path == '':
            self.path = '/index.html'
            super().do_GET()
            return
        elif path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        elif path == '/api/reports':
            reports = load_reports()
            self.send_json(200, reports)
            return
        elif path == '/api/workers':
            workers = load_workers()
            self.send_json(200, workers)
            return
        elif path == '/api/stats':
            reports = load_reports()
            stats = {
                "total": len(reports),
                "highSeverity": len([r for r in reports if r.get('severity') == 'High' and r.get('status') != 'Resolved']),
                "waterlogged": len([r for r in reports if r.get('water') == 'Yes' and r.get('status') != 'Resolved']),
                "resolved": len([r for r in reports if 'Resolved' in str(r.get('status')) or 'SOLVED' in str(r.get('status'))])
            }
            self.send_json(200, stats)
            return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/reports':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                new_report = json.loads(body.decode('utf-8'))
                reports = load_reports()

                dup = next((r for r in reports if r['id'] == new_report.get('id')), None)
                if dup:
                    self.send_json(200, {"status": "duplicate", "report": dup})
                    return

                # Check for exact or perceptual duplicate image payload
                dup_img = None
                new_img = new_report.get('imageData')
                new_hash = new_report.get('imageHash')
                if new_img or new_hash:
                    for r in reports:
                        r_hash = r.get('imageHash', '')
                        r_img = r.get('imageData', '')
                        if new_hash and r_hash and len(new_hash) > 10 and new_hash == r_hash:
                            dup_img = r
                            break
                        if new_img and r_img and len(new_img) > 200 and new_img == r_img:
                            dup_img = r
                            break
                        if new_hash and r_hash and new_hash.startswith("PHASH-") and r_hash.startswith("PHASH-"):
                            p1 = new_hash.split('_')
                            p2 = r_hash.split('_')
                            if len(p1) == 2 and len(p2) == 2:
                                b1, b2 = p1[1], p2[1]
                                diff = sum(c1 != c2 for c1, c2 in zip(b1, b2))
                                if diff <= 3:
                                    dup_img = r
                                    break

                if dup_img:
                    self.send_json(409, {
                        "status": "rejected",
                        "error": "DUPLICATE_IMAGE",
                        "message": f"This image has already been uploaded as Ticket {dup_img['id']}.",
                        "report": dup_img
                    })
                    return

                new_report = run_ai_automation_pipeline(new_report)
                reports.insert(0, new_report)
                save_reports(reports)
                self.send_json(201, {"status": "success", "report": new_report})
                return
            except Exception as e:
                self.send_json(400, {"error": str(e)})
                return
        elif path == '/api/workers':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                new_worker = json.loads(body.decode('utf-8'))
                workers = load_workers()
                if not new_worker.get('id'):
                    new_worker['id'] = f"W-{len(workers) + 101}"
                workers.append(new_worker)
                save_workers(workers)
                self.send_json(201, {"status": "success", "worker": new_worker})
                return
            except Exception as e:
                self.send_json(400, {"error": str(e)})
                return

        super().do_POST()

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/reports':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                update_data = json.loads(body.decode('utf-8'))
                ticket_id = update_data.get('id')

                reports = load_reports()
                target = next((r for r in reports if r['id'] == ticket_id), None)
                if target:
                    if 'status' in update_data: target['status'] = update_data['status']
                    if 'afterImageData' in update_data: target['afterImageData'] = update_data['afterImageData']
                    if 'verificationScore' in update_data: target['verificationScore'] = update_data['verificationScore']
                    if 'verificationDetail' in update_data: target['verificationDetail'] = update_data['verificationDetail']
                    save_reports(reports)
                    self.send_json(200, {"status": "updated", "report": target})
                else:
                    self.send_json(404, {"error": "Report not found"})
                return
            except Exception as e:
                self.send_json(400, {"error": str(e)})
                return

        super().do_PATCH()

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == '/api/workers':
            worker_id = query.get('id', [None])[0]
            if worker_id:
                workers = load_workers()
                workers = [w for w in workers if w.get('id') != worker_id]
                save_workers(workers)
                self.send_json(200, {"status": "deleted", "id": worker_id})
            else:
                self.send_json(400, {"error": "Missing worker id"})
            return

        super().do_DELETE()

def run_server():
    server_address = ('', PORT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = http.server.ThreadingHTTPServer(server_address, FullStackRequestHandler)
    print(f"Full-Stack Multi-Threaded REST API & Web Server running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
