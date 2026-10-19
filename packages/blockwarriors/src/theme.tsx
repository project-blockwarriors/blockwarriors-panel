import { useId, useState } from 'react';
import { ArrowUpRight, Blocks, LogOut, Terminal, ChevronDown } from 'lucide-react';
import {
    Button,
    Form,
    Input,
    Label,
    PanelLink,
    PageContentBlock,
    SubNavigation,
    SubNavigationLayout,
} from '@pterodactyl/sdk';
import { defineTheme, Main, Slot, View, type FieldModel, type ViewProps } from '@pterodactyl/sdk/theme';

function Brand() {
    return (
        <span className='bw-brand'>
            <span className='bw-mark'>
                <Blocks size={20} aria-hidden />
            </span>
            <span>
                BLOCKWARRIORS<span className='bw-product'>Server management</span>
            </span>
        </span>
    );
}

function AppLayout({ model, children }: ViewProps<'layout.app'>) {
    return (
        <div className='bw-app'>
            <header className='bw-header'>
                <div className='bw-header-inner'>
                    <PanelLink destination={{ to: '/' }} className='bw-brand-link' aria-label='BlockWarriors servers'>
                        <Brand />
                    </PanelLink>
                    <nav aria-label='Main navigation' className='bw-nav'>
                        <Slot name='nav.items.before' />
                        {model.links.map((link) => (
                            <PanelLink
                                key={link.id}
                                destination={link.destination}
                                exact={link.exact}
                                className='bw-nav-link'
                            >
                                {link.id === 'dashboard' ? 'Servers' : link.id === 'admin' ? 'Admin' : 'Account'}
                            </PanelLink>
                        ))}
                        <PanelLink destination={{ to: '/account/api' }} className='bw-nav-link'>
                            <Terminal size={15} aria-hidden />
                            <span>Agent access</span>
                        </PanelLink>
                        <button
                            className='bw-icon-button'
                            type='button'
                            aria-label='Sign out'
                            title='Sign out'
                            onClick={model.signOut}
                            disabled={model.signingOut}
                        >
                            <LogOut size={17} />
                        </button>
                        <Slot name='nav.items.after' />
                    </nav>
                </div>
            </header>
            <Main>{children}</Main>
            <footer className='bw-footer'>
                BlockWarriors infrastructure{' '}
                <span>
                    Powered by{' '}
                    <a href='https://pterodactyl.io' target='_blank' rel='noreferrer'>
                        Pterodactyl
                    </a>
                </span>
            </footer>
        </div>
    );
}

function Dashboard({ Default, ...props }: ViewProps<'page.dashboard'>) {
    return (
        <>
            <section className='bw-intro'>
                <div>
                    <p className='bw-eyebrow'>THE BLOCKWARRIORS WORKSPACE</p>
                    <h1>Your servers. Ready to build.</h1>
                    <p>Launch worlds, ship your bots, and keep the game running.</p>
                </div>
                <PanelLink destination={{ to: '/account/api' }} className='bw-action'>
                    <Terminal size={17} aria-hidden />
                    Connect your agent
                    <ArrowUpRight size={16} aria-hidden />
                </PanelLink>
            </section>
            <Default {...props} />
        </>
    );
}

const primaryTabs = new Set(['index', 'files', 'backups', 'users']);
function ServerLayout({ model, children }: ViewProps<'layout.server'>) {
    const [advanced, setAdvanced] = useState(false);
    const extras = model.nav.items.filter((item) => !primaryTabs.has(item.id));
    return (
        <>
            <section className='bw-server-heading'>
                <div>
                    <PanelLink destination={{ to: '/' }} className='bw-eyebrow'>
                        ALL SERVERS /
                    </PanelLink>
                    <h1>{model.name}</h1>
                    <p>Console, files, backups, and access. Everything for this world.</p>
                </div>
                <button
                    type='button'
                    className='bw-secondary'
                    aria-expanded={advanced}
                    onClick={() => setAdvanced(!advanced)}
                >
                    Advanced <ChevronDown size={15} aria-hidden />
                </button>
            </section>
            <SubNavigationLayout
                navigation={
                    <SubNavigation
                        items={model.nav.items.filter((item) => primaryTabs.has(item.id))}
                        renderItem={(item) => (item.id === 'users' ? 'Members' : item.label)}
                        before={<Slot name='server.navigation.before' data={model.server} />}
                        after={<Slot name='server.navigation.after' data={model.server} />}
                    />
                }
            >
                {advanced && (
                    <nav className='bw-advanced' aria-label='Advanced server tools'>
                        {extras.map((item) => (
                            <PanelLink key={item.id} destination={item.destination} className='bw-nav-link'>
                                {item.label}
                            </PanelLink>
                        ))}
                        {model.adminLink && (
                            <PanelLink destination={model.adminLink.destination} className='bw-nav-link'>
                                Server administration
                            </PanelLink>
                        )}
                    </nav>
                )}
                <Main>{children}</Main>
            </SubNavigationLayout>
        </>
    );
}

function AuthLayout({ children }: ViewProps<'layout.auth'>) {
    return (
        <div className='bw-auth'>
            <a href='/' className='bw-brand-link'>
                <Brand />
            </a>
            <Main>{children}</Main>
            <p className='bw-auth-footer'>Build something worth competing for.</p>
        </div>
    );
}

function LoginField({ field, label }: { field: FieldModel; label: string }) {
    const id = useId();
    return (
        <div className='bw-field'>
            <Label htmlFor={id}>{label}</Label>
            <Input
                {...field.fieldProps}
                id={id}
                aria-invalid={!!field.error}
                aria-describedby={field.error ? `${id}-error` : undefined}
            />
            {field.error && (
                <p id={`${id}-error`} className='bw-error'>
                    {field.error}
                </p>
            )}
        </div>
    );
}

function Login({ model }: ViewProps<'page.auth.login'>) {
    const { Captcha } = model;
    return (
        <section className='bw-login'>
            <p className='bw-eyebrow'>MEMBER ACCESS</p>
            <h1>Welcome back.</h1>
            <p>Sign in to your BlockWarriors workspace.</p>
            <Form form={{ handleSubmit: model.submit }}>
                <LoginField field={model.fields.username} label='Username or email' />
                <LoginField field={model.fields.password} label='Password' />
                <Button type='submit' disabled={!model.canSubmit} isLoading={model.submitting} className='w-full'>
                    Sign in
                </Button>
                <Slot name='auth.login.form.after' data={model.route} />
                {Captcha && <Captcha />}
            </Form>
            <PanelLink destination={model.forgotPassword} className='bw-forgot'>
                Forgot your password?
            </PanelLink>
            <p className='bw-attribution'>Powered by Pterodactyl</p>
        </section>
    );
}

function AgentAccess({ Default, ...props }: ViewProps<'page.account.api'>) {
    const example = `export BW_PANEL_URL="${window.location.origin}"\n# Store BW_API_TOKEN in your environment or secret manager.\npython3 tools/blockwarriors/bw.py servers\npython3 tools/blockwarriors/bw.py status SERVER_ID`;
    return (
        <>
            <section className='bw-intro'>
                <div>
                    <p className='bw-eyebrow'>BUILT FOR YOUR CODING AGENT</p>
                    <h1>Give your agent the controls.</h1>
                    <p>Use your member API key to manage the servers you can access.</p>
                </div>
            </section>
            <PageContentBlock>
                <div className='bw-agent-grid'>
                    <article className='bw-panel'>
                        <Terminal size={22} aria-hidden />
                        <h2>One key. Your permissions.</h2>
                        <p>
                            Create a dedicated Client API key below, then give your agent the CLI and guide from our
                            repository.
                        </p>
                        <p>
                            Keys inherit your account’s access. For narrower access, use a separate member account with
                            only the required server permissions. Do not give an agent an administrator key.
                        </p>
                        <a
                            className='bw-doc-link'
                            href='https://github.com/project-blockwarriors/blockwarriors-panel/blob/blockwarriors-v2/docs/blockwarriors/agents.md'
                            target='_blank'
                            rel='noreferrer'
                        >
                            Agent setup guide <ArrowUpRight size={16} aria-hidden />
                        </a>
                    </article>
                    <article className='bw-code-panel'>
                        <p>QUICK START · FROM THE FORK CHECKOUT</p>
                        <pre>
                            <code>{example}</code>
                        </pre>
                        <p>Read operations are immediate. Power, console commands, and writes require --yes.</p>
                    </article>
                </div>
            </PageContentBlock>
            <Default {...props} />
        </>
    );
}

export default defineTheme({
    views: {
        'layout.app': AppLayout,
        'layout.auth': AuthLayout,
        'layout.server': ServerLayout,
        'page.dashboard': Dashboard,
        'page.auth.login': Login,
        'page.account.api': AgentAccess,
    },
});
