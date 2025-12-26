import http.server
import socketserver

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Force correct MIME type for sw.js
        if self.path.endswith(".js"):
            self.send_header("Content-Type", "application/javascript")
        # Disable caching to prevent future 304 errors during development
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        super().end_headers()

PORT = 81
with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
