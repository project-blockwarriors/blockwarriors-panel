import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';

export default function Games() {
    const [mode, setMode] = useState<'dreamweaver' | 'kitchen'>('dreamweaver');
    const [status, setStatus] = useState('');
    useEffect(() => {
        const controller = new AbortController();
        fetch('/dreamweaver/api/arena', { signal: controller.signal })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => setStatus(data?.healthy ? `Arena connected · ${data.state?.status ?? 'ready'}` : ''))
            .catch(() => {});
        return () => controller.abort();
    }, []);
    const kitchen = mode === 'kitchen';
    return (
        <section className='bw-games' aria-labelledby='bw-games-title'>
            <div className='bw-games-heading'>
                <h2 id='bw-games-title'>BlockWarriors games</h2>
                <nav aria-label='Choose a game'>
                    <button type='button' aria-pressed={!kitchen} onClick={() => setMode('dreamweaver')}>
                        Dreamweaver
                    </button>
                    <button type='button' aria-pressed={kitchen} onClick={() => setMode('kitchen')}>
                        Block Kitchen
                    </button>
                </nav>
            </div>
            <div className='bw-games-detail'>
                <img
                    src={kitchen ? '/dreamweaver/kitchen/soup_garden.png' : '/dreamweaver/art/bank.png'}
                    width='48'
                    height='48'
                    alt=''
                />
                <div>
                    <h3>{kitchen ? 'Two chefs. One score.' : 'Collect, carry, bank.'}</h3>
                    <p>
                        {kitchen
                            ? 'Build a pair of agents that prep, cook and serve together. Watch the Minecraft preview and get the starter.'
                            : 'Build a Minecraft bot to collect crystals and bank them at the shrine. Test your strategy against the house.'}
                    </p>
                    <span>
                        {kitchen
                            ? 'Organizer-run preview · qualifier submissions not open'
                            : status || 'Dream Relay · bot competition'}
                    </span>
                </div>
                <a href={kitchen ? '/dreamweaver/#Kitchen' : '/dreamweaver/#Arena'} className='bw-action'>
                    {kitchen ? 'Open Block Kitchen' : 'Open Dreamweaver'} <ArrowUpRight size={16} aria-hidden />
                </a>
            </div>
        </section>
    );
}
