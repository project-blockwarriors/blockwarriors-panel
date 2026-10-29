import { useId, useState } from 'react';
import AgentAccess from './AgentAccess';
import AdminLayout from './AdminLayout';
import Games from './Games';
import { ArrowUpRight, LogOut, Terminal, ChevronDown } from 'lucide-react';
import { Button, Form, Input, Label, PanelLink, SubNavigation, SubNavigationLayout } from '@pterodactyl/sdk';
import { defineTheme, Main, Slot, View, type FieldModel, type ViewProps } from '@pterodactyl/sdk/theme';

function Brand() {
    return (
        <span className='bw-brand'>
            <span className='bw-mark'>
                <svg width='28' height='28' viewBox='0 0 32 32' aria-hidden='true'>
                    <path d='M2 6h8v8h4V2h8v12h8v8H18v8h-8V18H2Z' fill='currentColor' />
                </svg>
            </span>
            <span>
                BlockWarriors
                <span className='bw-product'>Server management</span>
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
                        <a href='/dreamweaver/' className='bw-nav-link'>
                            Games
                        </a>
                        <Slot name='nav.items.after' />
                    </nav>
                </div>
            </header>
            <Main>{children}</Main>
            <footer className='bw-footer'>
                BlockWarriors{' '}
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
                    <h1>Servers</h1>
                    <p>Console, files, and access for your Minecraft servers.</p>
                </div>
                <PanelLink destination={{ to: '/account/api' }} className='bw-action'>
                    <Terminal size={17} aria-hidden />
                    API keys
                    <ArrowUpRight size={16} aria-hidden />
                </PanelLink>
            </section>
            <Games />
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
                        All servers
                    </PanelLink>
                    <h1>{model.name}</h1>
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
            <p className='bw-auth-footer'>BlockWarriors server management</p>
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
            <h1>Sign in</h1>
            <p>Sign in to manage your Minecraft servers.</p>
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

export default defineTheme({
    views: {
        'layout.app': AppLayout,
        'layout.admin': AdminLayout,
        'layout.auth': AuthLayout,
        'layout.server': ServerLayout,
        'page.dashboard': Dashboard,
        'page.auth.login': Login,
        'page.account.api': AgentAccess,
    },
});
