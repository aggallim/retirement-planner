#!/usr/bin/env python3
"""Copy the feedback Worker's secrets from environment variables into this
repo's GitHub Actions secrets (intent/026; tools/feedback/README.md step 3).

Reads CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and FEEDBACK_GITHUB_TOKEN
from the environment and authenticates with SETUP_GITHUB_TOKEN (fine-grained,
Secrets: read and write on the repo). Values are encrypted with the repo's
public key, as GitHub requires, and never printed.

    pip install pynacl
    python3 tools/feedback/set_actions_secrets.py [owner/repo]
"""
import base64
import json
import os
import sys
import urllib.request

from nacl import encoding, public

REPO = sys.argv[1] if len(sys.argv) > 1 else 'aggallim/retirement-planner'
NAMES = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'FEEDBACK_GITHUB_TOKEN']


def api(method, path, token, body=None):
    req = urllib.request.Request(
        f'https://api.github.com/repos/{REPO}/actions/secrets{path}',
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            'Authorization': f'Bearer {token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
        },
    )
    with urllib.request.urlopen(req) as res:
        raw = res.read()
        return res.status, (json.loads(raw) if raw else None)


def main():
    token = os.environ.get('SETUP_GITHUB_TOKEN')
    missing = [n for n in ['SETUP_GITHUB_TOKEN'] + NAMES if not os.environ.get(n)]
    if missing:
        sys.exit(f'Missing environment variables: {", ".join(missing)}')

    _, key = api('GET', '/public-key', token)
    sealed = public.SealedBox(public.PublicKey(key['key'].encode(), encoding.Base64Encoder()))
    for name in NAMES:
        encrypted = base64.b64encode(sealed.encrypt(os.environ[name].encode())).decode()
        status, _ = api('PUT', f'/{name}', token, {'encrypted_value': encrypted, 'key_id': key['key_id']})
        print(f'{name}: {"created" if status == 201 else "updated"}')


if __name__ == '__main__':
    main()
