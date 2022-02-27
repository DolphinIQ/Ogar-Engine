import { nodeResolve } from '@rollup/plugin-node-resolve'; // bundles all dependencies

const outputPaths = [
    'dist/OGAR.module.js',
    'examples/dist/OGAR.module.js'
];

export default {
    input: 'src/Main.js',
    output: [
        {
            file: outputPaths[0],
            format: 'es'
        },
        {
            file: outputPaths[1],
            format: 'es'
        }
    ],
    plugins: [ nodeResolve() ],
};