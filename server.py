import http.server
import socketserver
import json
import os
import urllib.parse
import math
import sys
from datetime import datetime

# Configure stdout utf-8 encoding for Windows
if sys.platform.startswith('win'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Try loading PyMongo for native MongoDB connectivity
try:
    import pymongo
    HAS_PYMONGO = True
except ImportError:
    HAS_PYMONGO = False

PORT = int(os.environ.get('PORT', 8000))
DB_FILE = os.path.join(os.path.dirname(__file__), 'db', 'reports.json')
WORKERS_FILE = os.path.join(os.path.dirname(__file__), 'db', 'workers.json')
SMS_LOGS_FILE = os.path.join(os.path.dirname(__file__), 'db', 'sms_logs.json')

_reports_cache = None
_workers_cache = None
_sms_logs_cache = None

# MongoDB Connection State
MONGO_URI = os.environ.get('MONGODB_URI', 'mongodb://localhost:27017/')
mongo_client = None
mongo_db = None
mongo_connected = False
mongo_status_detail = "Disconnected (File Storage Active)"

def init_mongodb(uri=None):
    global mongo_client, mongo_db, mongo_connected, mongo_status_detail, MONGO_URI
    if not HAS_PYMONGO:
        mongo_connected = False
        mongo_status_detail = "pymongo library missing"
        return False

    target_uri = uri or MONGO_URI
    try:
        client = pymongo.MongoClient(target_uri, serverSelectionTimeoutMS=1500, connectTimeoutMS=1500)
        client.admin.command('ping')

        mongo_client = client
        mongo_db = mongo_client['roadmind_ai']
        mongo_connected = True
        MONGO_URI = target_uri
        sanitized_uri = target_uri.split('@')[-1] if '@' in target_uri else target_uri
        mongo_status_detail = f"Connected to MongoDB database (roadmind_ai) at {sanitized_uri}"
        print(f"[MongoDB Engine] {mongo_status_detail}")

        try:
            if mongo_db.reports.count_documents({}) == 0:
                file_reports = load_reports_file()
                if file_reports:
                    mongo_db.reports.insert_many(file_reports)
            if mongo_db.workers.count_documents({}) == 0:
                file_workers = load_workers_file()
                if file_workers:
                    mongo_db.workers.insert_many(file_workers)
        except Exception as sync_err:
            print(f"[MongoDB Sync Warning] {sync_err}")

        return True
    except Exception as e:
        mongo_connected = False
        mongo_status_detail = f"MongoDB connection inactive ({e}). Using file-backed db/*.json storage."
        print(f"[MongoDB Engine] {mongo_status_detail}")
        return False

try:
    init_mongodb()
except Exception as err:
    print(f"[MongoDB Engine Init] Non-blocking fallback: {err}")

def load_reports_file():
    if not os.path.exists(DB_FILE):
        os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)
        return []
    try:
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def load_reports():
    global _reports_cache
    if mongo_connected and mongo_db is not None:
        try:
            docs = list(mongo_db.reports.find({}, {'_id': 0}))
            if docs:
                _reports_cache = docs
                return docs
        except Exception as e:
            print(f"Mongo load reports error: {e}")

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

    if mongo_connected and mongo_db is not None:
        try:
            for item in data:
                mongo_db.reports.replace_one({"id": item["id"]}, item, upsert=True)
        except Exception as e:
            print(f"Mongo save reports error: {e}")

DEFAULT_WORKERS = [
    {
        "id": "SQUAD-1",
        "name": "Squad #1 (Sector 4 Rapid Paving Unit)",
        "lead": "Hemanth",
        "phone": "+91 8099606215",
        "email": "hemanth@city.gov.in",
        "lat": 12.9780,
        "lng": 77.5890,
        "status": "Available",
        "assignedTickets": 1
    },
    {
        "id": "SQUAD-2",
        "name": "Squad #2 (Central Hydro-Drainage Unit)",
        "lead": "Mahith",
        "phone": "+91 6302196653",
        "email": "mahith@city.gov.in",
        "lat": 12.9716,
        "lng": 77.5946,
        "status": "Available",
        "assignedTickets": 1
    },
    {
        "id": "SQUAD-3",
        "name": "Squad #3 (Heavy Asphalt Infrastructure)",
        "lead": "Nikhil",
        "phone": "+91 9989000040",
        "email": "nikhil@city.gov.in",
        "lat": 12.9650,
        "lng": 77.6020,
        "status": "Available",
        "assignedTickets": 1
    },
    {
        "id": "SQUAD-4",
        "name": "Squad #4 (Emergency Sub-Base Paving)",
        "lead": "Venkata Raghava",
        "phone": "+91 8099606215",
        "email": "raghava@city.gov.in",
        "lat": 12.9610,
        "lng": 77.5850,
        "status": "Available",
        "assignedTickets": 0
    },
    {
        "id": "SQUAD-5",
        "name": "Squad #5 (GIS Telemetry & Safety Marshal)",
        "lead": "Sri Hari",
        "phone": "+91 6302196653",
        "email": "srihari@city.gov.in",
        "lat": 12.9750,
        "lng": 77.6050,
        "status": "Available",
        "assignedTickets": 0
    }
]

def load_workers_file():
    if not os.path.exists(WORKERS_FILE):
        return DEFAULT_WORKERS
    try:
        with open(WORKERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_WORKERS

def load_workers():
    global _workers_cache
    if mongo_connected and mongo_db is not None:
        try:
            docs = list(mongo_db.workers.find({}, {'_id': 0}))
            if docs:
                _workers_cache = docs
                return docs
        except Exception:
            pass

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

    if mongo_connected and mongo_db is not None:
        try:
            for item in data:
                mongo_db.workers.replace_one({"id": item["id"]}, item, upsert=True)
        except Exception as e:
            print(f"Mongo save workers error: {e}")

def load_sms_logs():
    global _sms_logs_cache
    if mongo_connected and mongo_db is not None:
        try:
            return list(mongo_db.sms_logs.find({}, {'_id': 0}).sort('timestamp', -1))
        except Exception:
            pass

    if not os.path.exists(SMS_LOGS_FILE):
        return []
    try:
        with open(SMS_LOGS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_sms_log(log_entry):
    logs = load_sms_logs()
    logs.insert(0, log_entry)
    os.makedirs(os.path.dirname(SMS_LOGS_FILE), exist_ok=True)
    with open(SMS_LOGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(logs, f, indent=4)

    if mongo_connected and mongo_db is not None:
        try:
            mongo_db.sms_logs.replace_one({"id": log_entry["id"]}, log_entry, upsert=True)
        except Exception as e:
            print(f"Mongo save sms log error: {e}")

def send_worker_sms_notifications(report):
    assigned_workers = report.get('assignedWorkers', [])
    squad_name = report.get('assignedSquad', 'Assigned Squad')
    ticket_id = report.get('id', 'N/A')
    problem = report.get('problem', 'Urban Defect')
    location = report.get('location', 'Location')
    score = report.get('score', 80)
    lat = report.get('lat', 12.9716)
    lng = report.get('lng', 77.5946)

    # Google Maps Direct GPS Navigation Link for Worker
    nav_url = f"https://maps.google.com/?q={lat},{lng}"

    twilio_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    twilio_token = os.environ.get('TWILIO_AUTH_TOKEN')
    twilio_from = os.environ.get('TWILIO_PHONE_NUMBER')
    fast2sms_key = os.environ.get('FAST2SMS_API_KEY', 'xv8g9Vd7ehIkaRlsfGZiEzbM2u1OwSYCK4rqjmJToXUNQDnB30t9C3zd6j8RNw7J0Po4ZanbODSXFuEA')

    sent_logs = []
    for worker in assigned_workers:
        name = worker.get('name', 'Squad Engineer')
        phone = worker.get('phone', '')

        if not phone:
            phone = "+91 95019-2834"

        clean_digits = "".join([c for c in phone if c.isdigit()])
        if clean_digits.startswith("91") and len(clean_digits) == 12:
            clean_digits = clean_digits[2:]

        msg_body = f"[URBANGUARD DISPATCH #{ticket_id}]: Hello {name}, your squad ({squad_name}) is AUTO-ASSIGNED to {problem} at {location}. Urgency: {score}/100. GPS Nav: {nav_url}"

        status_text = "DELIVERED (SIMULATED SMS GATEWAY)"

        # Option A: Fast2SMS API Gateway (For Real SMS to Indian Mobile Numbers)
        if fast2sms_key and len(clean_digits) == 10:
            try:
                import urllib.request
                import urllib.error
                clean_msg = msg_body.replace('#', 'NO-').replace('&', 'and')
                encoded_msg = urllib.parse.quote(clean_msg)
                url = f"https://www.fast2sms.com/dev/bulkV2?authorization={fast2sms_key}&route=q&message={encoded_msg}&language=english&flash=0&numbers={clean_digits}"
                req = urllib.request.Request(url, headers={'cache-control': 'no-cache', 'User-Agent': 'Mozilla/5.0'})
                try:
                    with urllib.request.urlopen(req) as resp:
                        res_body = json.loads(resp.read().decode('utf-8'))
                        if res_body.get('return'):
                            status_text = f"DELIVERED REAL SMS (Fast2SMS API -> {phone})"
                        else:
                            status_text = f"Fast2SMS API: {res_body.get('message')}"
                except urllib.error.HTTPError as http_err:
                    err_payload = json.loads(http_err.read().decode('utf-8'))
                    status_text = f"Fast2SMS Gateway: {err_payload.get('message', http_err.reason)}"
            except Exception as err:
                status_text = f"Fast2SMS API Dispatch: {err}"

        # Option B: Twilio API Gateway (For Real SMS Internationally)
        elif twilio_sid and twilio_token and twilio_from:
            try:
                import base64
                import urllib.request
                url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                auth_header = "Basic " + base64.b64encode(f"{twilio_sid}:{twilio_token}".encode('utf-8')).decode('utf-8')
                post_data = urllib.parse.urlencode({
                    'To': phone,
                    'From': twilio_from,
                    'Body': msg_body
                }).encode('utf-8')

                req = urllib.request.Request(url, data=post_data, headers={'Authorization': auth_header})
                with urllib.request.urlopen(req) as resp:
                    status_text = f"DELIVERED REAL SMS (Twilio API -> {phone})"
            except Exception as err:
                status_text = f"SIMULATED SMS GATEWAY (Twilio attempt: {err})"

        log_entry = {
            "id": f"SMS-{int(datetime.now().timestamp() * 1000)}",
            "timestamp": datetime.now().isoformat(),
            "recipientName": name,
            "recipientPhone": phone,
            "squadName": squad_name,
            "ticketId": ticket_id,
            "message": msg_body,
            "status": status_text
        }
        save_sms_log(log_entry)
        sent_logs.append(log_entry)
        print(f"[SMS ALERT DISPATCHED] To {name} ({phone}): {msg_body}")

    return sent_logs

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

    lat = float(report.get('lat', 12.9716))
    lng = float(report.get('lng', 77.5946))
    problem = str(report.get('problem', '')).lower()
    severity = str(report.get('severity', '')).lower()
    
    depth = float(report.get('depthCm', 5.0))
    area = float(report.get('areaSqM', 0.5))

    # 1. AI Haversine Spatial Duplicate Cluster Suppression (< 35m)
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
        report['stateText'] = f"AI CLUSTER MERGED with Ticket {duplicate_ticket['id']} (Proximity Match)"

    # 2. AI Spatial Distance Proximity Auto-Assignment to Closest Worker Squad
    closest_squad = None
    min_distance = 99999999

    if workers and len(workers) > 0:
        for squad in workers:
            s_lat = float(squad.get('lat', 12.9716))
            s_lng = float(squad.get('lng', 77.5946))
            d = calculate_proximity(lat, lng, s_lat, s_lng)
            if d < min_distance:
                min_distance = d
                closest_squad = squad

        if not closest_squad:
            closest_squad = workers[0]

        dist_km = (min_distance / 1000.0) if min_distance < 99999 else 0.4
        report['assignedSquad'] = f"{closest_squad.get('name', 'Squad #1')} ({dist_km:.1f} km away)"
        report['assignedWorkers'] = [
            {
                "name": closest_squad.get('lead', 'Squad Lead'),
                "role": "Lead Paving & Hydraulic Specialist",
                "phone": closest_squad.get('phone', '+91 95019-2834'),
                "email": closest_squad.get('email', '')
            }
        ]

    # 3. DYNAMIC AI REPAIR BRIEFING, PRECAUTIONS & SCALED MATERIAL QUANTITIES
    if depth < 6.0 and area < 0.6 and 'water' not in problem and report.get('water') != 'Yes':
        # Small / Minor Defect (Light Repairs)
        kg_asphalt = max(15, math.ceil(area * depth * 12))
        report['aiTechnicalBrief'] = f"AI SURFACE ANALYSIS: Minor/Shallow Pothole (Depth: {depth:.1f}cm, Area: {area:.2f}m²). Recommended Action: Clean cavity & apply quick cold-mix patch."
        report['aiPrecautions'] = "⚠️ WORKER PRECAUTIONS: 1. Place 2 warning cones around repair spot. 2. Sweep away loose gravel/dust before patching. 3. Compact manually using a hand tamper roller."
        report['aiMaterialsChecklist'] = f"• {kg_asphalt} kg Ready Cold-Mix Asphalt Patch\n• Aerosol Tack-Coat Emulsion Spray\n• Hand Tamper Roller & Asphalt Broom"
    elif depth <= 10.0 and 'water' not in problem and report.get('water') != 'Yes':
        # Medium Defect (Standard Patching)
        kg_asphalt = math.ceil(area * depth * 22)
        report['aiTechnicalBrief'] = f"AI PAVEMENT ANALYSIS: Moderate Sub-Base Cavity (Depth: {depth:.1f}cm, Area: {area:.2f}m²). Recommended Action: Edge routing + hot-mix asphalt compaction."
        report['aiPrecautions'] = "⚠️ WORKER PRECAUTIONS: 1. Deploy traffic safety marshals. 2. Apply hot tack-coat binder to edges. 3. Compact in 2 layers using a walk-behind plate compactor."
        report['aiMaterialsChecklist'] = f"• {kg_asphalt} kg Hot-Mix Asphalt Concrete\n• Walk-Behind Vibratory Plate Compactor\n• Tack-Coat Emulsion Spray & Edge Router"
    else:
        # Large Structural Defect or Waterlogging (Heavy Repairs)
        tons_asphalt = min(4.5, round(area * depth * 0.05, 1))
        if tons_asphalt < 1.0: tons_asphalt = 1.2
        report['aiTechnicalBrief'] = f"AI STRUCTURAL AUDIT: Heavy Sub-Base Erosion / Waterpooling (Depth: {depth:.1f}cm, Area: {area:.2f}m²). Recommended Action: Hydro-vacuum basin + 15cm compacted bituminous base course."
        report['aiPrecautions'] = "⚠️ WORKER PRECAUTIONS: 1. Full lane closure with 25m safety cone radius. 2. De-water catch basin completely before tack coat. 3. Compact with 3-ton vibratory roller."
        report['aiMaterialsChecklist'] = f"• {tons_asphalt} Tons Bituminous Asphalt Concrete\n• Catch-Basin Vacuum Truck (if waterlogged)\n• Heavy 3-Ton Vibratory Roller & Tack Coat Unit"

    # Trigger SMS dispatch to assigned worker phone with Google Maps Navigation Link
    send_worker_sms_notifications(report)

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

    def serve_static_file(self, req_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        if req_path in ('/', '', '/index.html', '/Index.html'):
            rel_path = 'index.html'
        else:
            rel_path = req_path.lstrip('/')

        file_path = os.path.normpath(os.path.join(base_dir, rel_path))

        if not os.path.exists(file_path):
            dir_name = os.path.dirname(file_path)
            base_name = os.path.basename(file_path).lower()
            if os.path.exists(dir_name):
                for f in os.listdir(dir_name):
                    if f.lower() == base_name:
                        file_path = os.path.join(dir_name, f)
                        break

        if os.path.exists(file_path) and os.path.isfile(file_path):
            content_type = 'text/html'
            if file_path.endswith('.css'):
                content_type = 'text/css'
            elif file_path.endswith('.js'):
                content_type = 'application/javascript'
            elif file_path.endswith('.json'):
                content_type = 'application/json'
            elif file_path.endswith('.png'):
                content_type = 'image/png'
            elif file_path.endswith('.jpg') or file_path.endswith('.jpeg'):
                content_type = 'image/jpeg'
            elif file_path.endswith('.svg'):
                content_type = 'image/svg+xml'

            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-Type', f'{content_type}; charset=utf-8' if 'text' in content_type or 'json' in content_type or 'javascript' in content_type else content_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
                return
            except Exception as e:
                self.send_json(500, {"error": str(e)})
                return

        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(b"<html><body><h1>404 Not Found</h1><p>UrbanGuard AI Server could not find the requested file.</p></body></html>")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/favicon.ico':
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
        elif path == '/api/sms/logs':
            sms_logs = load_sms_logs()
            self.send_json(200, sms_logs)
            return
        elif path == '/api/mongodb/status':
            status_payload = {
                "connected": mongo_connected,
                "hasPyMongo": HAS_PYMONGO,
                "uri": MONGO_URI if mongo_connected else "N/A",
                "database": "roadmind_ai" if mongo_connected else "File-backed db/*.json",
                "reportsCount": mongo_db.reports.count_documents({}) if mongo_connected and mongo_db is not None else len(load_reports()),
                "workersCount": mongo_db.workers.count_documents({}) if mongo_connected and mongo_db is not None else len(load_workers()),
                "smsLogsCount": mongo_db.sms_logs.count_documents({}) if mongo_connected and mongo_db is not None else len(load_sms_logs()),
                "statusDetail": mongo_status_detail
            }
            self.send_json(200, status_payload)
            return
        elif path == '/api/stats':
            reports = load_reports()
            stats = {
                "total": len(reports),
                "highSeverity": len([r for r in reports if r.get('severity') == 'High' and r.get('status') != 'Resolved']),
                "waterlogged": len([r for r in reports if r.get('water') == 'Yes' and r.get('status') != 'Resolved']),
                "resolved": len([r for r in reports if 'Resolved' in str(r.get('status')) or 'SOLVED' in str(r.get('status'))]),
                "mongoConnected": mongo_connected,
                "smsLogsTotal": len(load_sms_logs())
            }
            self.send_json(200, stats)
            return

        self.serve_static_file(path)

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

                new_img = new_report.get('imageData')
                new_hash = new_report.get('imageHash')
                if new_img or new_hash:
                    for r in reports:
                        r_hash = r.get('imageHash', '')
                        r_img = r.get('imageData', '')
                        if new_hash and r_hash and len(new_hash) > 10 and new_hash == r_hash:
                            self.send_json(409, {"status": "rejected", "error": "DUPLICATE_IMAGE", "report": r})
                            return
                        if new_img and r_img and len(new_img) > 200 and new_img == r_img:
                            self.send_json(409, {"status": "rejected", "error": "DUPLICATE_IMAGE", "report": r})
                            return

                new_report = run_ai_automation_pipeline(new_report)
                reports.insert(0, new_report)
                save_reports(reports)
                self.send_json(201, {"status": "success", "report": new_report, "mongoConnected": mongo_connected})
                return
            except Exception as e:
                self.send_json(400, {"error": str(e)})
                return

        elif path == '/api/mongodb/connect':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                req_data = json.loads(body.decode('utf-8'))
                new_uri = req_data.get('uri')
                if not new_uri:
                    self.send_json(400, {"error": "Missing 'uri' parameter"})
                    return
                success = init_mongodb(new_uri)
                if success:
                    self.send_json(200, {"status": "connected", "uri": new_uri, "database": "roadmind_ai"})
                else:
                    self.send_json(400, {"status": "failed", "detail": mongo_status_detail})
                return
            except Exception as e:
                self.send_json(500, {"error": str(e)})
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

                    # Autonomous AI Completion Rule: If verification match >= 80%, AI automatically marks ticket as SOLVED
                    score = update_data.get('verificationScore', 0)
                    if score >= 80 or (target.get('verificationScore', 0) >= 80):
                        target['status'] = "✓ SOLVED & AI VERIFIED"
                        target['resolved'] = True
                        target['resolvedAt'] = datetime.now().isoformat()

                    save_reports(reports)

                    # Trigger status update SMS notification to worker lead
                    send_worker_sms_notifications(target)

                    self.send_json(200, {"status": "updated", "report": target, "autoCompletedByAI": target.get('resolved', False)})
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
    print(f"[RoadMind AI Engine] REST Server running on http://localhost:{PORT}")
    httpd.serve_forever()

if __name__ == '__main__':
    run_server()
