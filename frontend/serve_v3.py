import http.server
import socketserver
import os

PORT = 3002
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Clear-Site-Data', '"cache"')
        super().end_headers()

    def do_GET(self):
        # If the file doesn't exist, serve index.html
        path = self.translate_path(self.path.split('?')[0])
        if not os.path.exists(path):
            self.path = "/index.html"
        return super().do_GET()

with http.server.ThreadingHTTPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    httpd.serve_forever()
