import './src/theme.css';
import { createExtensionTestHost, preloadTheme, renderWithTheme } from '@pterodactyl/sdk/testing';
import { View } from '@pterodactyl/sdk/theme';
import theme from './src/theme';
await preloadTheme([theme]);
createExtensionTestHost({
    user: {
        uuid: 'preview-user',
        username: 'Alex',
        email: 'alex@example.test',
        language: 'en',
        rootAdmin: true,
        useTotp: false,
        createdAt: new Date(0),
        updatedAt: new Date(0),
    },
});
const page = new URLSearchParams(location.search).get('page');
// Synthetic fixture data only: never let the gallery issue real API requests.
const originalFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (new URL(url, location.href).pathname.startsWith('/api/')) {
        if (url.endsWith('/reveal'))
            return new Response(JSON.stringify({ token: 'DEMO-KEY-NOT-A-CREDENTIAL' }), { status: 200 });
        return new Response(
            JSON.stringify({
                data: [
                    {
                        attributes: {
                            identifier: 'demo_identifier',
                            description: 'My BlockWarriors key',
                            allowed_ips: [],
                            created_at: '2026-10-19T12:00:00Z',
                            last_used_at: null,
                        },
                    },
                ],
            }),
            { status: 200 }
        );
    }
    return originalFetch(input, init);
};
renderWithTheme(
    page === 'login' ? (
        <View name='layout.auth'>
            <View name='page.auth.login' />
        </View>
    ) : (
        <View name='layout.app'>
            {page === 'admin' ? (
                <View name='layout.admin'>
                    <section style={{ padding: 24 }}>
                        <h1 style={{ fontSize: 28 }}>Administration</h1>
                        <p>Manage users, infrastructure, servers, and panel settings.</p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: 20,
                                marginTop: 24,
                            }}
                        >
                            {['Nodes', 'Servers', 'Users', 'Settings'].map((name) => (
                                <article
                                    key={name}
                                    style={{
                                        background: 'white',
                                        padding: 24,
                                        border: '1px solid #eee',
                                        borderRadius: 8,
                                    }}
                                >
                                    <h2>{name}</h2>
                                    <p>Synthetic preview data</p>
                                </article>
                            ))}
                        </div>
                    </section>
                </View>
            ) : (
                <View name={page === 'agents' ? 'page.account.api' : 'page.dashboard'} />
            )}
        </View>
    ),
    { themes: [theme] }
);
