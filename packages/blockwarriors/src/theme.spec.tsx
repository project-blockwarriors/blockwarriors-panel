import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { preloadTheme, renderView, type RenderedView } from '@pterodactyl/sdk/testing';
import theme from './theme';
let rendered: RenderedView | undefined;
beforeAll(() => preloadTheme([theme]));
afterEach(() => {
    rendered?.unmount();
    vi.restoreAllMocks();
});
test('keeps the real sign-in fields and password recovery', () => {
    rendered = renderView('page.auth.login', { themes: [theme] });
    expect(screen.getByLabelText('Username or email')).toBeDefined();
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password');
    expect(screen.getByRole('link', { name: 'Forgot your password?' }).getAttribute('href')).toBe('/auth/password');
});
test('preserves admin navigation and adds member agent access', () => {
    rendered = renderView('layout.app', { themes: [theme], fixture: 'admin' });
    expect(screen.getByRole('link', { name: 'Admin' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Agent access' }).getAttribute('href')).toBe('/account/api');
});
test('advanced tools are opt-in and remain reachable', () => {
    rendered = renderView('layout.server', { themes: [theme] });
    expect(screen.queryByRole('navigation', { name: 'Advanced server tools' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
    expect(screen.getByRole('navigation', { name: 'Advanced server tools' })).toBeDefined();
});
test('admin sidebar collapses and expands without hiding page content', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
        matches: true,
        addEventListener() {},
        removeEventListener() {},
    } as unknown as MediaQueryList);
    localStorage.removeItem('bw-admin-navigation');
    rendered = renderView('layout.admin', { themes: [theme] });
    expect(screen.getByRole('navigation', { name: 'Administration' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Collapse admin sidebar' }));
    expect(screen.queryByRole('navigation', { name: 'Administration' })).toBeNull();
    expect(localStorage.getItem('bw-admin-navigation')).toBe('collapsed');
    fireEvent.click(screen.getByRole('button', { name: 'Expand admin sidebar' }));
    expect(screen.getByRole('navigation', { name: 'Administration' })).toBeDefined();
});
