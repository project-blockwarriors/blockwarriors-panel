#!/usr/bin/env python3
"""Dependency-free BlockWarriors member CLI. Credentials come only from the environment."""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        raise ValueError('Panel redirected the request; refusing to forward credentials.')


def request_plan(args):
    if args.action == 'servers':
        return 'GET', '/api/client?' + urllib.parse.urlencode({'page': args.page}), None
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,64}', args.server):
        raise ValueError('Use the server identifier returned by the servers command.')
    root = '/api/client/servers/' + args.server
    if args.action == 'status':
        return 'GET', root + '/resources', None
    if args.action == 'files':
        return 'GET', root + '/files/list?' + urllib.parse.urlencode({'directory': args.directory}), None
    if args.action == 'read':
        return 'GET', root + '/files/contents?' + urllib.parse.urlencode({'file': args.file}), None
    if not args.yes:
        raise ValueError('This operation changes the server. Review it and pass --yes to execute.')
    if args.action == 'power':
        return 'POST', root + '/power', {'signal': args.signal}
    if args.action == 'command':
        return 'POST', root + '/command', {'command': args.command}
    if args.action == 'write':
        return 'POST', root + '/files/write?' + urllib.parse.urlencode({'file': args.file}), sys.stdin.buffer.read(1024 * 1024 + 1)
    raise ValueError('Unknown action')


def call_api(method, path, body, environ=None):
    environ = os.environ if environ is None else environ
    base = environ.get('BW_PANEL_URL', 'https://mcpanel.blockwarriors.ai').rstrip('/')
    parsed = urllib.parse.urlsplit(base)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment or parsed.path:
        raise ValueError('BW_PANEL_URL must be an HTTPS origin without credentials, query, or path.')
    token = environ.get('BW_API_TOKEN', '')
    if not token:
        raise ValueError('Set BW_API_TOKEN to your Client API key. Do not pass it in command arguments.')
    data = body if isinstance(body, bytes) else json.dumps(body).encode() if body is not None else None
    if data and len(data) > 1024 * 1024:
        raise ValueError('Writes are limited to 1 MiB; use the panel or SFTP for larger files.')
    headers = {'Authorization': 'Bearer ' + token, 'Accept': 'application/json', 'User-Agent': 'BlockWarriors-CLI/1.0'}
    if data is not None:
        headers['Content-Type'] = 'text/plain' if isinstance(body, bytes) else 'application/json'
    req = urllib.request.Request(base + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.build_opener(NoRedirect()).open(req, timeout=25) as response:
            raw = response.read(4 * 1024 * 1024 + 1)
            if len(raw) > 4 * 1024 * 1024:
                raise ValueError('Response exceeds 4 MiB. Use the panel or SFTP.')
            if not raw:
                return {'ok': True, 'status': response.status}
            if 'application/json' in response.headers.get('Content-Type', ''):
                return json.loads(raw)
            return raw.decode('utf-8', errors='replace')
    except urllib.error.HTTPError as exc:
        # Do not echo response bodies: an upstream/proxy error can include credentials.
        raise ValueError(f'Panel returned HTTP {exc.code}. Check permissions, server state, and the panel activity log.') from None


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    subs = parser.add_subparsers(dest='action', required=True)
    listing = subs.add_parser('servers', help='List accessible servers as JSON, including pagination metadata')
    listing.add_argument('--page', type=int, default=1)
    for action in ['status', 'files', 'read', 'power', 'command', 'write']:
        p = subs.add_parser(action)
        p.add_argument('server')
        if action == 'files':
            p.add_argument('directory', nargs='?', default='/')
        if action in ['read', 'write']:
            p.add_argument('file')
        if action == 'power':
            p.add_argument('signal', choices=['start', 'stop', 'restart'])
        if action == 'command':
            p.add_argument('command', help='One console command; quote it as a single argument')
        if action in ['power', 'command', 'write']:
            p.add_argument('--yes', action='store_true')
    args = parser.parse_args(argv)
    try:
        result = call_api(*request_plan(args))
        print(json.dumps(result, indent=2) if not isinstance(result, str) else result)
    except (ValueError, urllib.error.URLError, TimeoutError) as exc:
        print(json.dumps({'error': str(exc)}), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
