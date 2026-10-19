import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import AgentAccess from './AgentAccess';

vi.mock('@pterodactyl/sdk', () => ({
    PageContentBlock: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
const key = {
    identifier: 'ptlc_example',
    description: 'My BlockWarriors key',
    allowed_ips: [],
    created_at: '2026-10-19T12:00:00Z',
    last_used_at: null,
};
const response = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;
afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

test('lists saved keys without fetching their secrets and clearly explains capabilities', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ data: [{ attributes: key }] }));
    vi.stubGlobal('fetch', fetch);
    render(<AgentAccess />);
    await screen.findByText('My BlockWarriors key');
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Currently requires an administrator/)).toBeDefined();
    expect(screen.queryByLabelText('Full API key')).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy key' })).toBeDefined();
});

test('reveals only on request then hides', async () => {
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(response({ data: [{ attributes: key }] }))
        .mockResolvedValueOnce(response({ token: 'ptlc_example-test-secret' }));
    vi.stubGlobal('fetch', fetch);
    render(<AgentAccess />);
    await screen.findByText('My BlockWarriors key');
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    expect(((await screen.findByLabelText('Full API key')) as HTMLInputElement).value).toBe('ptlc_example-test-secret');
    expect(fetch.mock.calls[1][0]).toBe('/api/client/account/api-keys/ptlc_example/reveal');
    fireEvent.click(screen.getByRole('button', { name: 'Hide' }));
    expect(screen.queryByLabelText('Full API key')).toBeNull();
});

test('creates a named key with CSRF protection and refreshes the list', async () => {
    document.cookie = 'XSRF-TOKEN=test%3Dcsrf';
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(response({ data: [] }))
        .mockResolvedValueOnce(response({}))
        .mockResolvedValueOnce(response({ data: [{ attributes: key }] }));
    vi.stubGlobal('fetch', fetch);
    render(<AgentAccess />);
    await screen.findByText(/No active keys/);
    fireEvent.change(screen.getByLabelText(/Key name/), { target: { value: 'Cursor' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create key' }));
    await screen.findByText('My BlockWarriors key');
    expect(JSON.parse(fetch.mock.calls[1][1].body).description).toBe('Cursor');
    expect(fetch.mock.calls[1][1].headers['X-XSRF-TOKEN']).toBe('test=csrf');
});

test('requires explicit confirmation before revoking and removes the key', async () => {
    const fetch = vi
        .fn()
        .mockResolvedValueOnce(response({ data: [{ attributes: key }] }))
        .mockResolvedValueOnce(response(null, 204))
        .mockResolvedValueOnce(response({ data: [] }));
    vi.stubGlobal('fetch', fetch);
    render(<AgentAccess />);
    await screen.findByText('My BlockWarriors key');
    fireEvent.click(screen.getByRole('button', { name: 'Revoke' }));
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(
        within(screen.getByRole('group', { name: 'Confirm revocation' })).getByRole('button', {
            name: 'Revoke this key',
        })
    );
    await screen.findByText(/No active keys/);
    expect(fetch.mock.calls[1][1].method).toBe('DELETE');
});

test('failed reveal does not display a secret and surfaces a useful error', async () => {
    vi.stubGlobal(
        'fetch',
        vi
            .fn()
            .mockResolvedValueOnce(response({ data: [{ attributes: key }] }))
            .mockResolvedValueOnce(response({}, 403))
    );
    render(<AgentAccess />);
    await screen.findByText('My BlockWarriors key');
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('signed-in panel session'));
    expect(screen.queryByLabelText('Full API key')).toBeNull();
});
