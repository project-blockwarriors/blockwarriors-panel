import { defineConfig } from 'vitest/config';
import { pterodactylTestAliases, pterodactylTestSetup, pterodactylTestDirectory } from '../sdk/vitest.mjs';
export default defineConfig({
    server: { fs: { allow: [process.cwd(), pterodactylTestDirectory] } },
    resolve: { alias: pterodactylTestAliases() },
    test: { environment: 'jsdom', setupFiles: [pterodactylTestSetup], include: ['src/**/*.spec.tsx'] },
});
