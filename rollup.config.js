import { nodeResolve } from '@rollup/plugin-node-resolve'; // bundles all dependencies

export default {
    input: 'src/Main.js',
    output: [
        {
            file: 'dist/OGAR.module.js',
            format: 'es'
        },
        {
            file: 'examples/dist/OGAR.module.js',
            format: 'es'
        }
    ],
    plugins: [ nodeResolve() ],
};