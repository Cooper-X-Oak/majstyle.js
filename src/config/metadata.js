// Userscript 元数据配置
export var USERSCRIPT_METADATA = {
    name: '雀魂金玉四麻风格分析助手',
    namespace: 'http://tampermonkey.net/',
    version: '2.1.0-beta.2',
    description: '金之间/玉之间四人麻将对手风格实时分析（基于牌谱屋数据）- Phase 1 可解释性增强',
    match: [
        'https://game.maj-soul.com/*',
        'https://game.maj-soul.net/*'
    ],
    grant: ['GM_xmlhttpRequest', 'unsafeWindow'],
    connect: ['5-data.amae-koromo.com']
};
