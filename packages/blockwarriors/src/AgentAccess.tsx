import { useEffect, useState } from 'react';
import { PageContentBlock } from '@pterodactyl/sdk';

type Key = {
    identifier: string;
    description: string;
    created_at: string;
    last_used_at: string | null;
    allowed_ips: string[] | null;
};
type KeyResponse = { data: { attributes: Key }[] };

async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const csrf = document.cookie
        .split('; ')
        .find((v) => v.startsWith('XSRF-TOKEN='))
        ?.slice(11);
    const response = await fetch(`/api/client/account/api-keys${path}`, {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-XSRF-TOKEN': decodeURIComponent(csrf) } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
        const message =
            response.status === 429
                ? 'Too many requests. Wait a minute and try again.'
                : response.status === 401 || response.status === 419
                  ? 'Your session expired. Sign in again.'
                  : response.status === 403
                    ? 'This action requires a signed-in panel session with the appropriate permissions.'
                    : response.status === 400
                      ? 'Unable to create another key. Accounts can have up to 25 keys.'
                      : 'Unable to complete this request. Please try again.';
        throw new Error(message);
    }
    return response.status === 204 ? (undefined as T) : response.json();
}

const date = (value: string | null) =>
    value
        ? new Date(value).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : 'Never';

export default function AgentAccess() {
    const [keys, setKeys] = useState<Key[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [name, setName] = useState('');
    const [secret, setSecret] = useState<{ id: string; token: string } | null>(null);
    const [revoking, setRevoking] = useState<string | null>(null);
    const origin = window.location.origin;
    const instructions = `Use the BlockWarriors panel API at ${origin}/api/client. Read BW_API_TOKEN from the environment; never print or commit it. Authenticate with Authorization: Bearer <BW_API_TOKEN>. GET / lists my servers (follow pagination). For a server identifier: GET /servers/{id}/resources for status; GET /servers/{id}/files/list?directory=/ for files; GET /servers/{id}/files/contents?file=/path to read; POST /servers/{id}/files/write?file=/path with a text/plain body to write; POST /servers/{id}/power with JSON {"signal":"start"}, "stop", or "restart"; POST /servers/{id}/command with JSON {"command":"..."}. Follow my instructions and server permissions. Server creation currently requires an administrator. Do not assume a member key grants provisioning privileges. Guide: https://github.com/project-blockwarriors/blockwarriors-panel/blob/blockwarriors-v2/docs/blockwarriors/agents.md`;

    const refresh = async () => {
        const result = await api<KeyResponse>('');
        setKeys(result.data.map((item) => item.attributes).sort((a, b) => b.created_at.localeCompare(a.created_at)));
    };
    useEffect(() => {
        let active = true;
        api<KeyResponse>('')
            .then((r) => {
                if (active)
                    setKeys(r.data.map((x) => x.attributes).sort((a, b) => b.created_at.localeCompare(a.created_at)));
            })
            .catch((e: Error) => {
                if (active) setError(e.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);
    useEffect(() => {
        if (!secret) return;
        const timer = window.setTimeout(() => setSecret(null), 60_000);
        const hide = () => {
            if (document.hidden) setSecret(null);
        };
        document.addEventListener('visibilitychange', hide);
        return () => {
            window.clearTimeout(timer);
            document.removeEventListener('visibilitychange', hide);
        };
    }, [secret]);
    const run = async (task: () => Promise<void>) => {
        setBusy(true);
        setError('');
        setNotice('');
        try {
            await task();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to complete this request.');
        } finally {
            setBusy(false);
        }
    };
    const reveal = async (key: Key) => {
        const result = await api<{ token: string }>(`/${encodeURIComponent(key.identifier)}/reveal`, 'POST');
        return result.token;
    };
    const copy = async (value: string, message: string) => {
        try {
            await navigator.clipboard.writeText(value);
            setNotice(message);
        } catch {
            throw new Error('Clipboard access was blocked. Use Show and copy the text manually.');
        }
    };

    return (
        <>
            <section className='bw-intro'>
                <div>
                    <h1>API keys</h1>
                    <p>Connect an agent or script to your Minecraft servers.</p>
                </div>
            </section>
            <PageContentBlock title='API keys & agent access'>
                <div className='bw-access'>
                    <div className='bw-access-columns'>
                        <section className='bw-panel bw-key-section' aria-label='Your API keys'>
                            <div className='bw-key-heading'>
                                <div>
                                    <h2>Your keys</h2>
                                    <p>Show or copy an existing key, or name a new one.</p>
                                </div>
                            </div>
                            <form
                                className='bw-key-create'
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void run(async () => {
                                        await api('', 'POST', {
                                            description: name.trim() || 'Agent key',
                                            allowed_ips: [],
                                        });
                                        setName('');
                                        await refresh();
                                        setNotice('Key created. Use Copy key to connect your agent.');
                                    });
                                }}
                            >
                                <label htmlFor='bw-key-name'>
                                    Key name <span>(optional)</span>
                                    <input
                                        id='bw-key-name'
                                        value={name}
                                        maxLength={500}
                                        placeholder='e.g. Arena development'
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </label>
                                <button className='bw-action' type='submit' disabled={busy || loading}>
                                    Create key
                                </button>
                            </form>
                            {error && (
                                <p className='bw-error' role='alert'>
                                    {error}
                                </p>
                            )}
                            <p className='bw-key-notice' role='status'>
                                {notice}
                            </p>
                            {loading ? (
                                <p>Loading your keys…</p>
                            ) : keys.length === 0 ? (
                                <p>No active keys. Create one above when you’re ready to connect an agent.</p>
                            ) : (
                                <div className='bw-key-list'>
                                    {keys.map((key) => (
                                        <article
                                            className='bw-key'
                                            key={key.identifier}
                                            aria-label={`Key: ${key.description}`}
                                        >
                                            <div className='bw-key-row'>
                                                <div>
                                                    <h3>{key.description || 'API key'}</h3>
                                                    <code>{key.identifier}••••••••</code>
                                                    <p>
                                                        Created {date(key.created_at)} · Last used{' '}
                                                        {date(key.last_used_at)}
                                                    </p>
                                                    {!!key.allowed_ips?.length && (
                                                        <p>Restricted to: {key.allowed_ips.join(', ')}</p>
                                                    )}
                                                </div>
                                                <div className='bw-key-buttons'>
                                                    <button
                                                        className='bw-secondary'
                                                        disabled={busy}
                                                        onClick={() => {
                                                            if (secret?.id === key.identifier) setSecret(null);
                                                            else
                                                                void run(async () =>
                                                                    setSecret({
                                                                        id: key.identifier,
                                                                        token: await reveal(key),
                                                                    })
                                                                );
                                                        }}
                                                    >
                                                        {secret?.id === key.identifier ? 'Hide' : 'Show'}
                                                    </button>
                                                    <button
                                                        className='bw-secondary'
                                                        disabled={busy}
                                                        onClick={() =>
                                                            void run(async () => {
                                                                const token = await reveal(key);
                                                                setSecret({
                                                                    id: key.identifier,
                                                                    token,
                                                                });
                                                                await copy(
                                                                    token,
                                                                    'Key copied. Paste it into your agent’s secret store.'
                                                                );
                                                            })
                                                        }
                                                    >
                                                        Copy key
                                                    </button>
                                                    <button
                                                        className='bw-revoke'
                                                        disabled={busy}
                                                        onClick={() => setRevoking(key.identifier)}
                                                    >
                                                        Revoke
                                                    </button>
                                                </div>
                                            </div>
                                            {secret?.id === key.identifier && (
                                                <div className='bw-revealed'>
                                                    <label htmlFor={`secret-${key.identifier}`}>
                                                        Full API key
                                                        <input
                                                            id={`secret-${key.identifier}`}
                                                            readOnly
                                                            autoComplete='off'
                                                            spellCheck={false}
                                                            value={secret.token}
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                    </label>
                                                    <p>Hides after one minute or when you leave this tab.</p>
                                                </div>
                                            )}
                                            {revoking === key.identifier && (
                                                <div
                                                    className='bw-revoke-confirm'
                                                    role='group'
                                                    aria-label='Confirm revocation'
                                                >
                                                    <p>
                                                        Revoke this key? Agents using it will lose access immediately.
                                                        It will not be recreated automatically.
                                                    </p>
                                                    <button
                                                        className='bw-revoke'
                                                        disabled={busy}
                                                        onClick={() =>
                                                            void run(async () => {
                                                                await api(
                                                                    `/${encodeURIComponent(key.identifier)}`,
                                                                    'DELETE'
                                                                );
                                                                setSecret(null);
                                                                setRevoking(null);
                                                                await refresh();
                                                                setNotice('Key revoked.');
                                                            })
                                                        }
                                                    >
                                                        Revoke this key
                                                    </button>
                                                    <button
                                                        className='bw-secondary'
                                                        disabled={busy}
                                                        onClick={() => setRevoking(null)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </article>
                                    ))}
                                </div>
                            )}
                            {!loading && (
                                <button className='bw-secondary' disabled={busy} onClick={() => void run(refresh)}>
                                    Refresh keys
                                </button>
                            )}
                        </section>
                        <section className='bw-connect' aria-label='Connect your coding agent'>
                            <h2>Connect your agent</h2>
                            <p>
                                Keys can edit files, send console commands, and control power on servers you can access.
                                Creating servers currently requires an administrator.
                            </p>
                            <ol>
                                <li>
                                    Copy a key above and save it as <code>BW_API_TOKEN</code> in your agent’s
                                    environment or secret store.
                                </li>
                                <li>
                                    Give your agent these instructions. They describe the API without including your
                                    key.
                                </li>
                            </ol>
                            <button
                                className='bw-action'
                                disabled={busy}
                                onClick={() =>
                                    void run(() =>
                                        copy(instructions, 'Agent instructions copied. Your API key is not included.')
                                    )
                                }
                            >
                                Copy agent instructions
                            </button>
                            <details>
                                <summary>View agent instructions</summary>
                                <pre>{instructions}</pre>
                            </details>
                            <p>
                                API base URL: <code>{origin}/api/client</code>
                            </p>
                            <a
                                className='bw-doc-link'
                                href='https://github.com/project-blockwarriors/blockwarriors-panel/blob/blockwarriors-v2/docs/blockwarriors/agents.md'
                                target='_blank'
                                rel='noreferrer'
                            >
                                API examples & optional CLI →
                            </a>
                        </section>
                    </div>
                </div>
            </PageContentBlock>
        </>
    );
}
