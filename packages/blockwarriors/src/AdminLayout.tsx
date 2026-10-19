import { useEffect, useRef, useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavigationLabel, usePanelLocation } from '@pterodactyl/sdk';
import { Main, Navigation, NavigationLink, Slot, type ViewProps } from '@pterodactyl/sdk/theme';

export default function AdminLayout({ model, children }: ViewProps<'layout.admin'>) {
    const desktop = () => window.matchMedia?.('(min-width: 1024px)').matches ?? true;
    const [open, setOpen] = useState(() => {
        try {
            return desktop() && localStorage.getItem('bw-admin-navigation') !== 'collapsed';
        } catch {
            return desktop();
        }
    });
    const toggle = useRef<HTMLButtonElement>(null);
    const { pathname } = usePanelLocation();
    const setNavigation = (next: boolean) => {
        setOpen(next);
        if (desktop()) {
            try {
                localStorage.setItem('bw-admin-navigation', next ? 'expanded' : 'collapsed');
            } catch {
                /* Storage may be blocked. */
            }
        }
    };
    useEffect(() => {
        if (!desktop()) setOpen(false);
    }, [pathname]);
    useEffect(() => {
        const query = window.matchMedia?.('(min-width: 1024px)');
        const resize = () => {
            if (!query?.matches) setOpen(false);
        };
        query?.addEventListener('change', resize);
        return () => query?.removeEventListener('change', resize);
    }, []);
    return (
        <div className={`bw-admin ${open ? 'bw-admin-expanded' : 'bw-admin-collapsed'}`}>
            <aside
                className='bw-admin-sidebar'
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && open) {
                        setNavigation(false);
                        toggle.current?.focus();
                    }
                }}
            >
                <button
                    ref={toggle}
                    className='bw-secondary bw-admin-toggle'
                    type='button'
                    aria-controls='bw-admin-navigation'
                    aria-expanded={open}
                    aria-label={open ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
                    title={open ? 'Collapse admin sidebar' : 'Expand admin sidebar'}
                    onClick={() => setNavigation(!open)}
                >
                    {open ? <PanelLeftClose size={19} aria-hidden /> : <PanelLeftOpen size={19} aria-hidden />}
                    {open && <span>Administration</span>}
                </button>
                {open && (
                    <nav id='bw-admin-navigation' aria-label='Administration'>
                        <Slot name='panel.navigation.before' />
                        <Navigation items={model.nav.items}>
                            {(item, state) => (
                                <NavigationLink item={item} className='bw-admin-link'>
                                    <NavigationLabel
                                        label={item.label}
                                        group={item.group}
                                        icon={item.icon}
                                        badge={state.badge}
                                    />
                                </NavigationLink>
                            )}
                        </Navigation>
                        <a href='/dreamweaver/' className='bw-admin-link'>
                            Dreamweaver competition
                        </a>
                        <Slot name='panel.navigation.after' />
                    </nav>
                )}
            </aside>
            <div className='bw-admin-content'>
                <Main>{children}</Main>
            </div>
        </div>
    );
}
