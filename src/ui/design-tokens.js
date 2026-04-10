// UI 设计令牌 - 所有视觉设计的唯一真实来源
// 修改此文件即可调整整体 UI 风格，无需触碰组件代码

// 颜色系统
export var COLORS = {
    // 语义色
    title:         '#ffd700',              // 原型称号 - 金色
    playerName:    '#aaa',                 // 玩家昵称 - 灰色
    tag:           '#ffa500',              // 风格标签 - 橙色
    strategyTitle: '#4fc3f7',              // 策略建议标题 - 浅蓝
    secondary:     '#999',                 // 次要说明文字
    text:          '#fff',                 // 主文字
    textMuted:     '#ddd',                 // 弱化文字
    divider:       'rgba(255,255,255,0.2)',// 分隔线
    hint:          '#666',                 // 折叠提示文字

    // 偏差色（正偏差=红，负偏差=绿，表示相对段位基准的偏离）
    deviation: {
        posStrong: '#ff4444',  // 正偏差强（>2x threshold）
        posMid:    '#ff6b6b',  // 正偏差中
        posWeak:   '#ff9999',  // 正偏差弱
        negStrong: '#44ff44',  // 负偏差强
        negMid:    '#51cf66',  // 负偏差中
        negWeak:   '#99ff99',  // 负偏差弱
        neutral:   '#aaa'      // 无偏差
    },

    // 危险度色（同时用于策略建议优先级色阶）
    danger: {
        critical: '#ff1744',   // 9-10 极危险
        high:     '#ff9800',   // 7-8  高危
        medium:   '#ffc107',   // 5-6  中等
        low:      '#8bc34a',   // 3-4  较低
        safe:     '#4caf50'    // 0-2  安全
    }
};

// 背景与阴影
export var BACKGROUNDS = {
    card:    'rgba(0,0,0,0.75)',
    cardDim: 'rgba(0,0,0,0.5)',    // 无数据状态
    shadow:  '0 0 10px rgba(0,0,0,0.5)'
};

// 布局
export var LAYOUT = {
    zIndex:           10000,
    borderRadius:     '8px',
    padding:          '6px 10px',
    maxWidthCompact:  '200px',
    maxWidthExpanded: '280px',

    // 四角定位（自己=左下，对手按计数器顺序分配）
    positions: {
        self: 'bottom: 140px; left: 10px;',
        opponents: [
            'top: 140px; right: 10px;',   // 右上角
            'top: 10px; right: 10px;',    // 右上角（靠上）
            'top: 140px; left: 10px;'     // 左上角
        ]
    }
};

// 字体
export var TYPOGRAPHY = {
    title:      { size: '11px', weight: 'bold' },
    data:       { size: '10px' },
    body:       { size: '9px' },
    aux:        { size: '8px' },
    lineHeight: '1.4'
};
