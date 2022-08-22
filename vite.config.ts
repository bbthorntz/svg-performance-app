import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    base: '/svg-performance-app/',
    plugins: [react()],
    resolve: {
        alias: {
            stream: 'stream-browserify',
        },
    },
})