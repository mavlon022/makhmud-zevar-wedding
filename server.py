from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
DATA_FILE = Path(os.environ.get("RSVP_DATA_FILE", ROOT / "rsvps.json"))
FALLBACK_DATA_FILE = Path(os.environ.get("TMPDIR", "/tmp")) / "makhmud-zevar-rsvps.json"
ADMIN_CODE = os.environ.get("ADMIN_CODE", "MZ2026")


class WeddingHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/rsvps":
            if not self.is_admin_request():
                self.send_error(HTTPStatus.UNAUTHORIZED, "Admin code required")
                return
            self.send_json(load_rsvps())
            return
        if path == "/api/rsvps.csv":
            if not self.is_admin_request():
                self.send_error(HTTPStatus.UNAUTHORIZED, "Admin code required")
                return
            self.send_csv(load_rsvps())
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/api/rsvp":
            self.send_error(HTTPStatus.NOT_FOUND)
            return

        length = int(self.headers.get("Content-Length", "0"))
        try:
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            self.send_error(HTTPStatus.BAD_REQUEST, "Invalid JSON")
            return

        guest_name = str(payload.get("guestName", "")).strip()
        attendance = str(payload.get("attendance", "")).strip()
        message = str(payload.get("message", "")).strip()

        if not guest_name or attendance not in {"Coming", "Not coming"}:
            self.send_error(HTTPStatus.BAD_REQUEST, "Missing required fields")
            return

        entry = {
            "guestName": guest_name,
            "attendance": attendance,
            "message": message,
            "createdAt": datetime.now(timezone.utc).isoformat(),
        }

        items = load_rsvps()
        items.append(entry)
        save_rsvps(items)
        self.send_json({"ok": True, "entry": entry})

    def send_json(self, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_csv(self, items):
        import io

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["guestName", "attendance", "message", "createdAt"])
        writer.writeheader()
        writer.writerows(items)
        body = output.getvalue().encode("utf-8-sig")

        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "text/csv; charset=utf-8")
        self.send_header("Content-Disposition", "attachment; filename=makhmud-zevar-rsvps.csv")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def is_admin_request(self):
        code = self.headers.get("X-Admin-Code", "")
        return code == ADMIN_CODE


def load_rsvps():
    for path in (DATA_FILE, FALLBACK_DATA_FILE):
        if not path.exists():
            continue
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
    return []


def save_rsvps(items):
    body = json.dumps(items, ensure_ascii=False, indent=2)
    for path in (DATA_FILE, FALLBACK_DATA_FILE):
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(body, encoding="utf-8")
            return
        except OSError:
            continue
    raise OSError("Could not write RSVP data")


if __name__ == "__main__":
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8765"))
    server = ThreadingHTTPServer((host, port), WeddingHandler)
    print(f"Serving wedding invitation on http://{host}:{port}/")
    print(f"Admin dashboard: http://{host}:{port}/admin.html")
    server.serve_forever()
