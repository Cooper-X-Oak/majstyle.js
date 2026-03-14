# 雀魂游戏对象结构档案

> 创建时间: 2026-03-14
> 目的: 记录雀魂游戏内部可访问的对象结构，评估实时数据监听的可行性

## 使用说明

1. 在雀魂游戏中安装并启用用户脚本
2. 进入对局界面
3. 按下 `Ctrl+Alt+E` 触发数据探索模式
4. 查看浏览器控制台输出
5. 将结果记录到本文档

---

## 已知游戏对象

### unsafeWindow

Tampermonkey 提供的访问页面全局对象的接口

### view 对象

```javascript
unsafeWindow.view
```

#### view.DesktopMgr

桌面管理器，包含对局相关信息

```javascript
unsafeWindow.view.DesktopMgr.Inst
```

**已知属性**:

- `player_datas` - 玩家数据数组（4个玩家）
  - 结构待探索

**待探索**:

- 其他可用属性
- 可监听的事件

### GameMgr 对象

游戏管理器

```javascript
unsafeWindow.GameMgr.Inst
```

**已知属性**:

- `account_id` - 当前玩家的账号 ID

**待探索**:

- 其他可用属性
- 游戏状态信息
- 对局进度数据

---

## 探索任务清单

### 基础对象结构

- [ ] 探索 `view` 对象的完整属性列表
- [ ] 探索 `view.DesktopMgr` 的完整属性
- [ ] 探索 `view.DesktopMgr.Inst` 的完整属性
- [ ] 探索 `GameMgr.Inst` 的完整属性

### 玩家数据结构

- [ ] 探索 `player_datas` 数组的完整结构
- [ ] 记录每个玩家对象包含的字段
- [ ] 测试数据的更新时机

### 事件系统

- [ ] 查找游戏的事件系统
- [ ] 测试是否可以监听出牌事件
- [ ] 测试是否可以监听立直事件
- [ ] 测试是否可以监听和牌/放铳事件
- [ ] 测试是否可以监听副露事件

### 对局状态

- [ ] 探索当前局数、本场数等信息
- [ ] 探索玩家点数信息
- [ ] 探索牌山剩余数量
- [ ] 探索宝牌指示牌信息

---

## 探索结果

### view 对象属性

```
压缩备注
NAME=userscript.html?name=%25E9%259B%2580%25E9%25AD%2582%25E9%2587%2591%25E7%258E%2589%25E5%259B%259B%25E9%25BA%25BB%25E9%25A3%258E%25E6%25A0%25BC%25E5%2588%2586%25E6%259E%2590%25E5%258A%25A9%25E6%2589%258B.user.js&id=398d20fc-1eee-4104-8c0b-8270d9df471d

NAME:776 ========================================
NAME:777          雀魂对手风格分析
NAME:778 ========================================
NAME:611 
NAME:612 座位0: 表意的符号 (ID:14766635) [你]
NAME:611 
NAME:612 座位1: 電腦(簡單) (ID:1)
NAME:614   [电脑]
NAME:611 
NAME:612 座位2: 電腦(簡單) (ID:3)
NAME:614   [电脑]
NAME:611 
NAME:612 座位3: 電腦(簡單) (ID:2)
NAME:614   [电脑]
NAME:584   段位: 杰3 | 称号: 摆烂人 [慢热型, 好型立直]
NAME:585   
NAME:586   【进攻】相对杰3平均
NAME:587     立直率: 18.6% (-1.0%)
NAME:588     副露率: 33.2% (-0.6%)
NAME:589     和牌率: 22.4% (0.2%)
NAME:590     平均打点: 6847 (196)
NAME:591     进攻意愿: 51.8% (-1.6%)
NAME:592     进攻效率: 43.4%
NAME:593   
NAME:594   【防守】
NAME:595     放铳率: 14.2% (-0.9%)
NAME:596   
NAME:597   【立直质量】
NAME:598     追立率: 21.7%
NAME:599     先制率: 78.3%
NAME:600     立直好型: 79.8%
NAME:601   
NAME:602   【策略建议】
NAME:798 
NAME:799 ========================================
NAME:707 
NAME:708 ========================================
NAME:709       数据探索模式已触发
NAME:710       快捷键: Ctrl+Alt+E
NAME:711 ========================================
NAME:712 
NAME:61 === 雀魂游戏对象结构探索 ===
NAME:62 提示: 将以下结果记录到 docs/GAME_OBJECT_STRUCTURE.md
NAME:63 
NAME:67 【view 对象】
NAME:68 可用属性: (54) ['ActionBase', 'ActionOperation', 'EAudioType', 'AudioInfo', 'AudioMgr', 'ActionHuleXueZhanMid', 'Block_QiPai', 'HandPai3D', 'ActionDealTile', 'ActionDiscardTile', 'ActionNewCard', 'ActionLiuJu', 'ActionUnveilTile', 'ERevealState', 'ViewPai', 'ActionSelectGap', 'HandPaiPlane', 'E_Bgm_Type', 'BgmListMgr', 'ActionBabei', 'ActionGangResult', 'PAIMODEL_HEIGHT', 'PAIMODEL_WIDTH', 'PAIMODEL_THICKNESS', 'PAI_COUNT', 'BAIDA_COUNT', 'ELink_State', 'ERuleMode', 'EMJMode', 'ERecordType', 'DesktopMgr', 'ActionGangResultEnd', 'ActionFillAwaitingTiles', 'ActionChiPengGang', 'ActionHuleXueZhanEnd', 'ActionChangeTile', 'ModelAnimationController', 'ActionHule', 'ActionLiqi', 'ViewPlayer', 'ViewPlayer_Other', 'ActionNoTile', 'Block_Babei', 'ActionAnGangAddGang', 'ActionLockTile', 'Block_HuanSanZhang', 'ViewPlayer_Me', 'ActionNewRound', 'ActionRevealTile', 'MJTutorialMgr', 'EGameVoiceType', 'EMindVoiceType', 'DeskAudioMgr', 'Block_Ming']
NAME:69 
NAME:73 【view.DesktopMgr 对象】
NAME:74 可用属性: (9) ['is_yuren_type', 'EnDecode', 'Inst', 'player_link_state', 'click_prefer', 'double_click_pass', 'en_mjp', 'bianjietishi', '_is_yuren_type']
NAME:75 
NAME:79 【view.DesktopMgr.Inst 对象】
NAME:81 可用属性 (111 个): (111) ['_destroyed', '_id', '_enable', '_owner', 'started', '_events', 'rule_mode', 'mode', 'active', 'game_config', 'seat', 'dora', 'xuezhan', 'anpai', 'last_anpai_score', 'players', 'mainrole', 'num_left_show', 'container_other', 'plane_chang', 'plane_ju', 'container_other_reveal', 'plane_chang_reveal', 'plane_ju_reveal', 'num_left_show_reveal', 'score_reveal', 'trans_container_effect', 'trans_container_fullscreeen_effect', 'effect_pai_canchi', 'effect_pai_canchi_maka', 'effect_dora3D', 'effect_dora3D_touying', 'effect_doraPlane', 'effect_shadow', 'effect_shadow_touming', 'effect_recommend', 'auto_hule', 'auto_nofulu', 'auto_moqie', 'auto_babei', 'auto_liqi', 'emoji_switch', 'duringReconnect', 'gameing', 'lastpai_seat', 'lastqipai', 'oplist', 'liqi_select', 'operation_showing', 'myaccountid', 'player_datas', 'player_effects', 'mjp_res_name', 'mjpb_res_name', 'gameEndResult', 'lastRoundRecord', 'levelchangeinfo', 'activity_reward', 'badgeChange', 'rewardinfo', 'choosed_pai', 'muyu_info', 'muyu_effect', 'actionList', 'action_index', 'current_step', 'actionMap', 'tingpais', '_record_show_hand', '_ob_show_hand', '_record_show_paopai', '_ob_show_paopai', 'record_show_anim', '_ob_follow_dealer', 'isShowTingTip', 'ptchange', 'waiting_lingshang_deal_tile', 'md5', 'sha256', 'saltSha256', 'salt', 'paipu_config', 'ai_level', 'timestoped', 'handles_after_timerun', 'doactioncd', 'dochain_fast', 'action_running', 'hangupCount', 'state_cache', 'mind_voice_seat', 'mind_voice_type', 'during_playing_mind_voice', 'extraGameSoundId', 'isPlayedPrepareAudio', 'effectBeiShuiFires', 'lastWheelClickTime', 'wheelCd', 'resetPaiEffectList', 'teamNameTexs', …]
NAME:82 
NAME:86 【player_datas 数组】
NAME:88 玩家数量: 4
NAME:90 第一个玩家对象的属性: (10) ['account_id', 'avatar_id', 'title', 'nickname', 'level', 'character', 'level3', 'avatar_frame', 'verified', 'views']
NAME:91 第一个玩家数据示例: {
  "account_id": 14766635,
  "avatar_id": 404902,
  "title": 600006,
  "nickname": "表意的符号",
  "level": {
    "id": 10303,
    "score": 1742
  },
  "character": {
    "charid": 200049,
    "level": 5,
    "exp": 0,
    "skin": 404902,
    "is_upgraded": true,
    "extra_emoji": [
      10,
      11,
      12
    ]
  },
  "level3": {
    "id": 20202,
    "score": 240
  },
  "avatar_frame": 0,
  "verified": 0,
  "views": [
    {
      "slot": 0,
      "item_id": 305018
    },
    {
      "slot": 2,
      "item_id": 308042
    },
    {
      "slot": 10,
      "item_id": 30590001
    },
    {
      "slot": 4,
      "item_id": 305055
    },
    {
      "slot": 6,
      "item_id": 305815
    },
    {
      "slot": 7,
      "item_id": 308045
    }
  ]
}
NAME:93 
NAME:103 【GameMgr 对象】
NAME:104 可用属性: (15) ['encodeP', '_inRes', 'Inst', 'config_data', 'system_email_url', 'dhs_url', 'prefix_url', 'device_id', '_in_china', '_in_google_play', '_in_dmm', '_client_region', 'client_language', 'client_type', 'country']
NAME:105 
NAME:107 【GameMgr.Inst 对象】
NAME:109 可用属性 (108 个): (108) ['stage', 'uimgr', 'root_ui', 'root_scene', 'root_front_scene_effect', 'root_front_effect', 'logined', 'link_url', 'player_name', 'account_id', 'account_setting', 'account_data', 'accountVerifiedData', 'account_numerical_resource', 'yostar_accessToken', 'yostar_uid', 'yostar_login_info', 'player_in_haiwai', 'mjp_view', 'mjp_surface_view', 'touming_mjp_view', 'specialMJPMView', 'mjp_item_id', 'mjp_surface_id', 'mj_server_location', 'mj_game_token', 'mj_game_uuid', 'ingame', 'beinvited_roomid', 'outsee_paipuid', 'custom_match_id', 'in_shilian', 'in_ab_match', 'in_kuangdu', 'in_saki', 'in_huiye', 'in_activity', 'in_activity_mode', 'last_game_mode_id', 'spot_chara_id', 'spot_activity_id', 'account_refresh_time', '_current_scene', '_scene_lobby', '_scene_mj', '_scene_amulet', '_scene_spot', '_scene_kuangdu', '_scene_saki', '_scene_huiye', '_scene_activity', 'duringPaipu', '_statisticinfo', '_last_heatbeat_time', '_pre_mouse_point', '_fastin', 'comment_allow', 'server_time_delta', 'client_endpoint', '_ad_str', '_mail_account', 'phone_login', 'fb_login_info', 'runtime_id', 'need_test_ws', 'first_logined', 'free_diamonds', 'paid_diamonds', 'free_pifuquans', 'paid_pifuquans', 'record_uuid', 'record_start_time', 'record_end_time', 'fetch_count', 'have_send_login_beat', 'in_emergence', 'emergence_notice', 'last_load_start_time', 'login_loading_end', 'game_status', 'nickname_replace_enable', 'auth_check_id', 'auth_nc_retry_count', 'open_dongtai', 'anys', 'save_items', 'logUpCount', 'logSuccessCount', 'logFailedCount', 'logAutoCount', 'move', 'mouseMoveCount', 'hide_nickname', 'hide_other_zone_name', 'hide_desktop_name', 'hide_paipu_name', 'hide_ob_name', 'hide_match_name', 'hide_rank_name', 'use_fetch_info', …]
NAME:110 
NAME:116   account_id: 14766635
NAME:119 
NAME:126 【事件系统探索】
NAME:134   发现事件方法: gameWindow.addEventListener
NAME:143 
NAME:144 === 探索完成 ===
NAME:145 请将以上结果记录到 docs/GAME_OBJECT_STRUCTURE.md
NAME:721 
NAME:722 === 探索玩家 API 数据 ===
NAME:723 账号ID: 14766635
NAME:724 正在请求 player_extended_stats...
NAME:725 
NAME:749 
NAME:750 ========================================
NAME:751 提示: 使用 tools/api-explorer.html 可以更方便地探索 API
NAME:752 快捷键: Ctrl+Alt+E
NAME:753 ========================================
NAME:727 【player_extended_stats 完整响应】
NAME:728 {
  "count": 1733,
  "和牌率": 0.224466243508367,
  "自摸率": 0.3264781491002571,
  "默听率": 0.11825192802056556,
  "放铳率": 0.14195037507212926,
  "副露率": 0.3317945758799769,
  "立直率": 0.18580496249278708,
  "平均打点": 6847,
  "最大连庄": 5,
  "和了巡数": 12.572622107969151,
  "平均铳点": 5364,
  "流局率": 0.10675129832660127,
  "流听率": 0.4864864864864865,
  "一发率": 0.20625,
  "里宝率": 0.30625,
  "被炸率": 0.07874015748031496,
  "平均被炸点数": 11320,
  "放铳时立直率": 0.18292682926829268,
  "放铳时副露率": 0.3780487804878049,
  "立直后放铳率": 0.13975155279503104,
  "立直后非瞬间放铳率": 0.08385093167701864,
  "副露后放铳率": 0.1617391304347826,
  "立直后和牌率": 0.4968944099378882,
  "副露后和牌率": 0.3182608695652174,
  "立直后流局率": 0.09006211180124224,
  "副露后流局率": 0.12347826086956522,
  "放铳至立直": 101,
  "放铳至副露": 126,
  "放铳至默听": 20,
  "立直和了": 160,
  "副露和了": 183,
  "默听和了": 46,
  "立直巡目": 9.795807453416149,
  "立直收支": 3116,
  "立直收入": 8398,
  "立直支出": 6111,
  "先制率": 0.782608695652174,
  "追立率": 0.21739130434782608,
  "被追率": 0.18944099378881987,
  "振听立直率": 0.015527950310559006,
  "立直好型": 0.7981366459627329,
  "立直多面": 0.7981366459627329,
  "立直好型2": 0.4906832298136646,
  "役满": 1,
  "最大累计番数": 9,
  "W立直": 1,
  "打点效率": 1537,
  "铳点损失": 761,
  "净打点效率": 775,
  "平均起手向听": 3.447778418926717,
  "平均起手向听亲": 3.1425389755011137,
  "平均起手向听子": 3.554517133956386,
  "最近大铳": {
    "id": "250709-3544f592-6651-4ca6-857f-059250c72b89",
    "start_time": 1752055904,
    "fans": [
      {
        "id": 7,
        "label": "役牌 白",
        "count": 1,
        "役满": 0
      },
      {
        "id": 8,
        "label": "役牌 发",
        "count": 1,
        "役满": 0
      },
      {
        "id": 21,
        "label": "对对和",
        "count": 2,
        "役满": 0
      },
      {
        "id": 27,
        "label": "混一色",
        "count": 2,
        "役满": 0
      },
      {
        "id": 31,
        "label": "宝牌",
        "count": 3,
        "役满": 0
      },
      {
        "id": 32,
        "label": "红宝牌",
        "count": 1,
        "役满": 0
      }
    ]
  },
  "id": 14766635,
  "played_modes": [
    12,
    9
  ]
}
NAME:729 
NAME:730 【字段清单】
NAME:739   count: number
NAME:739   和牌率: number
NAME:739   自摸率: number
NAME:739   默听率: number
NAME:739   放铳率: number
NAME:739   副露率: number
NAME:739   立直率: number
NAME:739   平均打点: number
NAME:739   最大连庄: number
NAME:739   和了巡数: number
NAME:739   平均铳点: number
NAME:739   流局率: number
NAME:739   流听率: number
NAME:739   一发率: number
NAME:739   里宝率: number
NAME:739   被炸率: number
NAME:739   平均被炸点数: number
NAME:739   放铳时立直率: number
NAME:739   放铳时副露率: number
NAME:739   立直后放铳率: number
NAME:739   立直后非瞬间放铳率: number
NAME:739   副露后放铳率: number
NAME:739   立直后和牌率: number
NAME:739   副露后和牌率: number
NAME:739   立直后流局率: number
NAME:739   副露后流局率: number
NAME:739   放铳至立直: number
NAME:739   放铳至副露: number
NAME:739   放铳至默听: number
NAME:739   立直和了: number
NAME:739   副露和了: number
NAME:739   默听和了: number
NAME:739   立直巡目: number
NAME:739   立直收支: number
NAME:739   立直收入: number
NAME:739   立直支出: number
NAME:739   先制率: number
NAME:739   追立率: number
NAME:739   被追率: number
NAME:739   振听立直率: number
NAME:739   立直好型: number
NAME:739   立直多面: number
NAME:739   立直好型2: number
NAME:739   役满: number
NAME:739   最大累计番数: number
NAME:739   W立直: number
NAME:739   打点效率: number
NAME:739   铳点损失: number
NAME:739   净打点效率: number
NAME:739   平均起手向听: number
NAME:739   平均起手向听亲: number
NAME:739   平均起手向听子: number
NAME:739   最近大铳: object
NAME:739   id: number
NAME:739   played_modes: array[2]
NAME:741 
NAME:742 请将以上结果记录到 docs/API_DATA_STRUCTURE.md

```

### view.DesktopMgr 属性

```
待补充
```

### view.DesktopMgr.Inst 属性

```
待补充
```

### GameMgr.Inst 属性

```
待补充
```

### player_datas 结构

```javascript
// 示例结构（待实际数据验证）
[
  {
    account_id: 14766635,
    nickname: "玩家昵称",
    level: { id: 10403, name: "杰3" },
    // ... 其他字段待补充
  },
  // ... 其他3个玩家
]
```

---

## 实时数据监听可行性评估

### 可行性判断标准

1. **数据可访问性** - 能否通过 JavaScript 访问到数据
2. **数据稳定性** - 数据结构是否稳定，不会频繁变化
3. **事件可监听性** - 是否有事件系统或可以轮询
4. **性能影响** - 监听是否会影响游戏性能

### 评估结果

待探索完成后填写：

- [ ] 实时数据监听 **可行** / **不可行**
- [ ] 推荐方案: ...
- [ ] 技术难点: ...
- [ ] 性能风险: ...

---

## 实时数据采集方案（如果可行）

### 方案 A: 事件监听

如果游戏提供事件系统：

```javascript
// 伪代码示例
gameEventBus.on('playerAction', function(action) {
  // 记录玩家行为
});
```

### 方案 B: 定时轮询

如果没有事件系统，使用定时器：

```javascript
// 伪代码示例
setInterval(function() {
  var currentState = getGameState();
  if (stateChanged(currentState)) {
    // 处理状态变化
  }
}, 1000);
```

### 方案 C: 混合方案

结合事件监听和轮询

---

## 下一步行动

1. ✅ 创建游戏对象探索功能
2. ⏳ 在游戏中触发探索模式
3. ⏳ 记录完整的对象结构
4. ⏳ 评估实时监听可行性
5. ⏳ 设计实时数据采集方案（如果可行）
