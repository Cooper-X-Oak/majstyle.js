// Userscript 元数据配置
export var USERSCRIPT_METADATA = {
    name: '雀魂四麻风格分析助手',
    namespace: 'http://tampermonkey.net/',
    version: '2.2.1',
    description: '四人麻将对手风格实时分析（支持所有段位）- v2.2.1 算法修复',
    match: [
        'https://game.maj-soul.com/*',
        'https://game.maj-soul.net/*'
    ],
    grant: ['GM_xmlhttpRequest', 'unsafeWindow'],
    connect: ['5-data.amae-koromo.com'],
    eslintDisable: true  // 禁用 ESLint 检查
};
