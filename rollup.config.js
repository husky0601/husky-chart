import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import json from 'rollup-plugin-json'
import typescript from "rollup-plugin-typescript";
import sourceMaps from "rollup-plugin-sourcemaps";
import {typescript as TS} from 'typescript'

import pkg from './package.json'

export default {
    input: 'src/index.ts',
    output:[
        {
            file: pkg.main,
            format: 'cjs',
            sourcemap: true
        },
        {
            file: pkg.module,
            format: 'es',
            sourcemap: true
        }
    ],
    external: ["react", "lodash"],
    experimentalCodeSplitting: true,
    plugins:[
        json({
            exclude: 'node_modules/**'
        }), 
        external(),
        postcss({
          modules: true
        }),
        url(),
        svgr(),
        babel({
            exclude: ['node_modules/**', '*.json'],
        }),
        resolve(),
        commonjs({
            include: ["node_modules/**"]
        }),
        typescript({
            exclude: "node_modules/**",
            typescript: TS
        }),
        sourceMaps()
    ]
}