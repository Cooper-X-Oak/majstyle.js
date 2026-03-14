import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';

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
  return lines.join('\n');
}

// Metadata configuration
var metadata = {
  name: '雀魂金玉四麻风格分析助手',
  namespace: 'http://tampermonkey.net/',
  version: '2.0.0',
  description: '金之间/玉之间四人麻将对手风格实时分析（基于牌谱屋数据）',
  match: [
    'https://game.maj-soul.com/*',
    'https://game.maj-soul.net/*'
  ],
  grant: ['GM_xmlhttpRequest', 'unsafeWindow'],
  connect: ['5-data.amae-koromo.com']
};

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/雀魂金玉四麻风格分析助手-v2.0.0.user.js',
    format: 'iife',
    banner: generateMetadataHeader(metadata)
  },
  plugins: [
    resolve(),
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
