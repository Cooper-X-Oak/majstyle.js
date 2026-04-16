// UI 设计令牌 - 所有视觉设计的唯一真实来源
// 修改此文件即可调整整体 UI 风格，无需触碰组件代码

// 颜色系统
export var COLORS = {
  // 语义色
  playerName: "rgba(255,255,255,0.5)", // 玩家昵称
  tag: "rgba(255,255,255,0.75)", // 风格标签
  strategyTitle: "#4fc3f7", // 策略建议标题
  text: "#ffffff", // 主文字
  textMuted: "rgba(255,255,255,0.6)", // 弱化文字
  divider: "rgba(255,255,255,0.15)", // 分隔线
  hint: "rgba(255,255,255,0.25)", // 折叠提示

  // 通用偏差颜色：高=红，低=绿
  // 适用于"越高越强"的指标（立直率、副露率、和牌率、打点）
  deviation: {
    highStrong: "#ff5252", // 高于平均很多（强红）
    highMid: "#ff8a80", // 高于平均（中红）
    highWeak: "#ffcdd2", // 略高于平均（淡红）
    lowWeak: "#b2dfdb", // 略低于平均（淡绿）
    lowMid: "#69f0ae", // 低于平均（中绿）
    lowStrong: "#00bfa5", // 低于平均很多（强绿）
    neutral: "#aaa", // 无偏差（灰）
  },

  // 称号稀有度系统（卡牌风格渐变边框）
  // 9种称号 × {渐变起止色, 发光色, 图标}
  rarity: {
    钢铁战士: {
      from: "#ffd700",
      to: "#ff8f00",
      glow: "rgba(255,215,0,0.4)",
      icon: "⚔️",
    },
    狂战士: {
      from: "#ff5252",
      to: "#b71c1c",
      glow: "rgba(255,82,82,0.4)",
      icon: "🔥",
    },
    自爆兵: {
      from: "#e040fb",
      to: "#6a1b9a",
      glow: "rgba(224,64,251,0.4)",
      icon: "💥",
    },
    忍者: {
      from: "#69f0ae",
      to: "#00695c",
      glow: "rgba(105,240,174,0.4)",
      icon: "🌙",
    },
    上班族: {
      from: "#448aff",
      to: "#1565c0",
      glow: "rgba(68,138,255,0.4)",
      icon: "📋",
    },
    赌徒: {
      from: "#ffab40",
      to: "#e65100",
      glow: "rgba(255,171,64,0.4)",
      icon: "🎲",
    },
    乌龟: {
      from: "#18ffff",
      to: "#006064",
      glow: "rgba(24,255,255,0.4)",
      icon: "🛡️",
    },
    摆烂人: {
      from: "#90a4ae",
      to: "#37474f",
      glow: "rgba(144,164,174,0.3)",
      icon: "💤",
    },
    送分童子: {
      from: "#bdbdbd",
      to: "#424242",
      glow: "rgba(189,189,189,0.25)",
      icon: "🎁",
    },
    default: {
      from: "#555",
      to: "#222",
      glow: "rgba(100,100,100,0.2)",
      icon: "❓",
    },
  },

  // 策略建议优先级色
  priority: {
    high: "#ff5252",
    mid: "#ffab40",
    low: "#69f0ae",
    normal: "rgba(255,255,255,0.5)",
  },
};

// 背景与阴影
export var BACKGROUNDS = {
  card: "rgba(12,10,28,0.92)", // 展开态背景
  cardCollapsed: "rgba(12,10,28,0.30)", // 折叠态背景（透明）
  cardDim: "rgba(8,8,20,0.55)", // 无数据状态
  shadow: "0 4px 20px rgba(0,0,0,0.7)",
};

// 布局
export var LAYOUT = {
  zIndex: 10000,
  borderRadius: "10px",
  padding: "8px 12px",
  maxWidthCompact: "210px",
  maxWidthExpanded: "260px",

  // 四角定位（自己=左下，对手按计数器顺序分配）
  positions: {
    self: "bottom: 140px; left: 10px;",
    opponents: [
      "bottom: 280px; right: 10px;",
      "top: 10px; right: 140px;",
      "top: 140px; left: 10px;",
    ],
  },
};

// 字体
export var TYPOGRAPHY = {
  title: { size: "12px", weight: "bold" },
  tag: { size: "9px" },
  data: { size: "10px" },
  aux: { size: "8px" },
  lineHeight: "1.5",
};
