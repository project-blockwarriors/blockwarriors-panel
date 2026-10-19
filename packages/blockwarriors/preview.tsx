import './src/theme.css';
import { preloadTheme, renderWithTheme } from '@pterodactyl/sdk/testing';
import { View } from '@pterodactyl/sdk/theme';
import theme from './src/theme';
await preloadTheme([theme]);
const page = new URLSearchParams(location.search).get('page');
renderWithTheme(
    page === 'login' ? (
        <View name='layout.auth'>
            <View name='page.auth.login' />
        </View>
    ) : (
        <View name='layout.app'>
            <View name={page === 'agents' ? 'page.account.api' : 'page.dashboard'} />
        </View>
    ),
    { themes: [theme] }
);
