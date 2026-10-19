import { defineConfig } from 'vite';
import { pterodactylTestAliases, pterodactylTestDirectory } from '../sdk/vitest.mjs';
export default defineConfig({
    // The SDK fixture renderer uses React act(), including in a static gallery build.
    define: { 'process.env.NODE_ENV': JSON.stringify('development') },
    server: { host: '127.0.0.1', port: 5187, fs: { allow: [process.cwd(), pterodactylTestDirectory] } },
    resolve: { alias: pterodactylTestAliases() },
    optimizeDeps: { include: ['react', 'react-dom/client'] },
});
