#!/usr/bin/env python3
"""Send a generated presenter script to the opt-in loopback bridge.
Run `npm run agent`, open its page, then run this example.
"""
import argparse
import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, ProxyHandler, HTTPRedirectHandler

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

# Never route private scripts through environment proxies or redirects.
opener = build_opener(ProxyHandler({}), NoRedirect())

parser = argparse.ArgumentParser()
parser.add_argument('--script', type=Path, default=Path(__file__).with_name('welcome.json'))
parser.add_argument('--mode', choices=['silent', 'speech'], default='silent')
parser.add_argument('--port', type=int, default=4173)
parser.add_argument('--stop', action='store_true')
args = parser.parse_args()
if not 1 <= args.port <= 65535:
    parser.error('port must be between 1 and 65535')
command = {'command': 'stop'} if args.stop else {
    'command': 'run',
    'script': json.loads(args.script.read_text(encoding='utf-8')),
    'options': {'mode': args.mode},
}
request = Request(f'http://127.0.0.1:{args.port}/api/commands', data=json.dumps(command).encode(), headers={'Content-Type': 'application/json'}, method='POST')
try:
    with opener.open(request, timeout=5) as response:
        print(response.read().decode())
except HTTPError as error:
    parser.exit(1, error.read().decode() + '\n')
except URLError as error:
    parser.exit(1, f'Local presenter unavailable. Start npm run agent and open its page. {error.reason}\n')
