import path from 'path';
import sourcemaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import * as pkg from './package.json';

const basePlugins = [
    sourcemaps(),
    typescript(),
];

const compiled = (new Date()).toUTCString().replace(/GMT/g, 'UTC');
const banner = [
    `/*!`,
    ` * pixi-spatial-hash - v${pkg.version}`,
    ` * Compiled ${compiled}`,
    ` *`,
    ` * pixi-spatial-hash is licensed under the MIT License.`,
    ` * http://www.opensource.org/licenses/mit-license`,
    ` */`,
].join('\n');
const bundleBanner = `${banner}
window.PIXI = window.PIXI || {};
`;
const bundleFooter = `
Object.assign(window.PIXI, __pixi_spatial_hash);
`;

export default [
    {
        plugins: basePlugins,
        input: path.join(__dirname, './src/index.ts'),
        output: [
            {
                banner,
                file: path.join(__dirname, './lib/pixi-spatial-hash.js'),
                format: 'cjs',
                freeze: false,
                sourcemap: true,
            },
            {
                banner,
                file: path.join(__dirname, './lib/pixi-spatial-hash.mjs'),
                format: 'es',
                freeze: false,
                sourcemap: true,
            },
        ],
    },
    {
        plugins: [...basePlugins, terser()],
        input: path.join(__dirname, './src/index.ts'),
        output: {
            banner: bundleBanner,
            file: path.join(__dirname, './dist/pixi-spatial-hash.js'),
            format: 'iife',
            freeze: false,
            footer: bundleFooter,
            name: '__pixi_spatial_hash',
            sourcemap: true,
            globals: {
                '@pixi/core': 'PIXI',
                '@pixi/math': 'PIXI',
                '@pixi/ticker': 'PIXI',
                '@pixi/display': 'PIXI',
            },
        },
    },
];
