import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Games from './Games';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});
test('game selection changes the destination and does not present Kitchen as a live arena', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ healthy: true, state: { status: 'idle' } }), {
            headers: { 'Content-Type': 'application/json' },
        })
    );
    render(<Games />);
    await screen.findByText('Arena connected · idle');
    expect(screen.getByRole('link', { name: 'Open Dreamweaver' }).getAttribute('href')).toBe('/dreamweaver/#Arena');
    fireEvent.click(screen.getByRole('button', { name: 'Block Kitchen' }));
    expect(screen.getByRole('link', { name: 'Open Block Kitchen' }).getAttribute('href')).toBe('/dreamweaver/#Kitchen');
    expect(screen.queryByText('Arena connected · idle')).toBeNull();
    expect(screen.getByText('Organizer-run preview · qualifier submissions not open')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Dreamweaver' }));
    expect(screen.getByText('Arena connected · idle')).toBeDefined();
});
