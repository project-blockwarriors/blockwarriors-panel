import { defineConfig } from 'vite';
import { pterodactylTestAliases, pterodactylTestDirectory } from '../sdk/vitest.mjs';
export default defineConfig({
    server: { host: '127.0.0.1', port: 5187, fs: { allow: [process.cwd(), pterodactylTestDirectory] } },
    resolve: { alias: pterodactylTestAliases() },
    optimizeDeps: { include: ['react', 'react-dom/client'] },
});
