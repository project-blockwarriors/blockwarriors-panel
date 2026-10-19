import argparse
import unittest
from unittest.mock import patch
import bw


class SafetyTests(unittest.TestCase):
    def test_mutations_require_explicit_execution(self):
        for action in ['power', 'command', 'write']:
            with self.assertRaisesRegex(ValueError, 'changes the server'):
                bw.request_plan(argparse.Namespace(action=action, server='abc123', yes=False))

    def test_server_identifier_cannot_escape_api_path(self):
        with self.assertRaises(ValueError):
            bw.request_plan(argparse.Namespace(action='status', server='../account'))

    def test_filename_is_encoded_as_data(self):
        plan = bw.request_plan(argparse.Namespace(action='read', server='abc123', file='/a?b&c.txt'))
        self.assertEqual(plan[1], '/api/client/servers/abc123/files/contents?file=%2Fa%3Fb%26c.txt')

    def test_insecure_and_embedded_credentials_origins_rejected(self):
        for url in ['http://example.com', 'https://a:b@example.com', 'https://example.com/path', 'https://example.com?x=1']:
            with self.assertRaises(ValueError):
                bw.call_api('GET', '/api/client', None, {'BW_PANEL_URL': url, 'BW_API_TOKEN': 'test'})

    def test_redirect_never_forwards_key(self):
        with self.assertRaisesRegex(ValueError, 'refusing'):
            bw.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://elsewhere.test')

    def test_api_shape_for_power(self):
        self.assertEqual(bw.request_plan(argparse.Namespace(action='power', server='abc123', yes=True, signal='start')), ('POST', '/api/client/servers/abc123/power', {'signal': 'start'}))


if __name__ == '__main__':
    unittest.main()
