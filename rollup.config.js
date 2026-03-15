import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import { USERSCRIPT_METADATA } from './src/config/metadata.js';

function generateMetadataHeader(meta) {
  var lines = ['// ==UserScript=='];
  lines.push('// @name         ' + meta.name);
  lines.push('// @namespace    ' + meta.namespace);
  lines.push('// @version      ' + meta.version);
  lines.push('// @description  ' + meta.description);
  meta.match.forEach(function(m) {
    lines.push('// @match        ' + m);
  });
  meta.grant.forEach(function(g) {
    lines.push('// @grant        ' + g);
  });
  meta.connect.forEach(function(c) {
    lines.push('// @connect      ' + c);
  });
  lines.push('// ==/UserScript==');
  lines.push('');
  lines.push('/* eslint-disable */');
  lines.push('');
  return lines.join('\n');
}

// Import metadata from single source of truth
var metadata = USERSCRIPT_METADATA;

export default {
  input: 'src/main.js',
  output: {
    file: `dist/${metadata.name}-v${metadata.version}.user.js`,
    format: 'iife',
    banner: generateMetadataHeader(metadata)
  },
  plugins: [
    resolve(),
    json(),
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: { ie: '11' },
          modules: false
        }]
      ]
    })
  ]
};
