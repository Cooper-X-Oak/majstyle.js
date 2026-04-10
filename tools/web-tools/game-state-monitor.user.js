// ==UserScript==
// @name         [测试] 雀魂游戏状态监测
// @namespace    majstyle-test
// @version      1.3.0
// @description  监测游戏开始/结束的信号变化，找出可靠的触发时机。测试完成后卸载。
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @match        *://game.mahjongsoul.com/*
// @match        *://mahjongsoul.game.yo-star.com/*
// @grant        unsafeWindow
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    var gw = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    // ─── 面板（默认展开，Alt+M 收起/展开）────────────────────────────────────

    var collapsed = false;

    var toggle = document.createElement('div');
    toggle.title = 'Alt+M 收起/展开';
    toggle.style.cssText = [
        'position:fixed', 'bottom:12px', 'right:12px', 'z-index:2147483647',
        'width:22px', 'height:22px', 'border-radius:50%',
        'background:#4f4', 'cursor:pointer',
        'box-shadow:0 0 8px #4f4', 'transition:background 0.3s',
        'display:none'
    ].join(';');
    document.body.appendChild(toggle);

    var panel = document.createElement('div');
    panel.style.cssText = [
        'position:fixed', 'bottom:12px', 'right:12px', 'z-index:2147483647',
        'background:rgba(0,0,0,0.88)', 'color:#ccc', 'font:11px/1.5 monospace',
        'padding:10px 12px', 'border-radius:6px', 'width:300px',
        'max-height:420px', 'overflow-y:auto', 'box-shadow:0 2px 12px rgba(0,0,0,0.6)',
        'border:1px solid #333'
    ].join(';');
    document.body.appendChild(panel);

    function setCollapsed(val) {
        collapsed = val;
        panel.style.display  = collapsed ? 'none'  : 'block';
        toggle.style.display = collapsed ? 'block' : 'none';
    }

    toggle.addEventListener('click', function () { setCollapsed(false); });

    document.addEventListener('keydown', function (e) {
        if (e.altKey && e.key === 'm') { setCollapsed(!collapsed); }
    });

    // ─── 状态读取 ─────────────────────────────────────────────────────────────

    function readState() {
        var s = {
            ingame: null, game_status: null, scene_name: null, scene_mj: null,
            d_gameing: null, d_started: null, d_active: null, d_players: null,
            dom_children: document.body ? document.body.childElementCount : 0,
            // 主脚本状态
            main_ns: !!(gw.majstyleJS),
            main_status: (gw.majstyleJS && gw.majstyleJS.status) || null,
            main_cards: document.querySelectorAll('.majsoul-style-info').length,
        };
        try {
            var gm = gw.GameMgr && gw.GameMgr.Inst;
            if (gm) {
                s.ingame      = gm.ingame;
                s.game_status = gm.game_status;
                s.scene_mj    = !!gm._scene_mj;
                try { s.scene_name = gm._current_scene ? gm._current_scene.constructor.name : null; } catch(e) {}
            }
        } catch(e) {}

        if (s.ingame) {
            try {
                var dm = gw.view && gw.view.DesktopMgr && gw.view.DesktopMgr.Inst;
                if (dm) {
                    s.d_gameing = dm.gameing;
                    s.d_started = dm.started;
                    s.d_active  = dm.active;
                    s.d_players = dm.player_datas ? dm.player_datas.length : 0;
                }
            } catch(e) {}
        }
        return s;
    }

    // ─── 事件日志（仅记录变化）───────────────────────────────────────────────

    var eventLog = [];

    function logEvent(msg, color) {
        var t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        var entry = { t: t, msg: msg, color: color || '#aaa' };
        eventLog.unshift(entry);
        if (eventLog.length > 50) eventLog.pop();
        console.log('[game-state-monitor] ' + t + ' ' + msg);
    }

    // ─── 变化检测 ─────────────────────────────────────────────────────────────

    var prev = null;

    function detectChanges(p, c) {
        if (!p) return;

        if (p.ingame !== c.ingame) {
            if (c.ingame) {
                logEvent('★ ingame: false → TRUE  ← 游戏开始', '#4f4');
            } else {
                logEvent('★ ingame: true → FALSE  ← 游戏结束', '#f84');
            }
        }
        if (JSON.stringify(p.game_status) !== JSON.stringify(c.game_status)) {
            logEvent('game_status: ' + JSON.stringify(p.game_status) + ' → ' + JSON.stringify(c.game_status), '#ff0');
        }
        if (p.scene_name !== c.scene_name) {
            logEvent('scene: ' + p.scene_name + ' → ' + c.scene_name, '#8cf');
        }
        if (p.scene_mj !== c.scene_mj) {
            logEvent('_scene_mj: ' + p.scene_mj + ' → ' + c.scene_mj, '#8cf');
        }
        if (p.d_gameing !== c.d_gameing) {
            logEvent('DesktopMgr.gameing: ' + p.d_gameing + ' → ' + c.d_gameing, '#f4f');
        }
        if (p.d_started !== c.d_started) {
            logEvent('DesktopMgr.started: ' + p.d_started + ' → ' + c.d_started, '#f4f');
        }
        if (p.d_active !== c.d_active) {
            logEvent('DesktopMgr.active: ' + p.d_active + ' → ' + c.d_active, '#f4f');
        }
        if (p.dom_children !== c.dom_children) {
            logEvent('DOM body.children: ' + p.dom_children + ' → ' + c.dom_children, '#666');
        }
        // 主脚本状态变化
        if (p.main_ns !== c.main_ns) {
            logEvent('主脚本命名空间: ' + p.main_ns + ' → ' + c.main_ns, c.main_ns ? '#4f4' : '#f44');
        }
        if (p.main_status !== c.main_status) {
            var color = '#aaa';
            if (c.main_status === 'observer-ready') color = '#4f4';
            if (c.main_status === 'processing')     color = '#ff0';
            if (c.main_status === 'done')           color = '#4f4';
            if (c.main_status && c.main_status.indexOf('error') === 0) color = '#f44';
            logEvent('主脚本状态: ' + p.main_status + ' → ' + c.main_status, color);
        }
        if (p.main_cards !== c.main_cards) {
            logEvent('分析卡片数: ' + p.main_cards + ' → ' + c.main_cards, c.main_cards > 0 ? '#4f4' : '#888');
        }
    }

    // ─── DOM 变化计数（不写入事件日志，只更新计数器）────────────────────────

    var domMutationCount = 0;
    var domObserver = new MutationObserver(function(mutations) {
        domMutationCount += mutations.length;
    });
    domObserver.observe(document.body, { childList: true, subtree: true });

    // ─── 复制日志 ─────────────────────────────────────────────────────────────

    function copyLog() {
        var text = eventLog.map(function(e) {
            return '[' + e.t + '] ' + e.msg;
        }).reverse().join('\n');
        navigator.clipboard.writeText(text).then(function() {
            copyBtn.textContent = '已复制!';
            setTimeout(function() { copyBtn.textContent = '复制日志'; }, 1500);
        }).catch(function() {
            // 降级方案
            var ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            copyBtn.textContent = '已复制!';
            setTimeout(function() { copyBtn.textContent = '复制日志'; }, 1500);
        });
    }

    // ─── 渲染面板 ─────────────────────────────────────────────────────────────

    // 复制按钮（持久存在，不随 innerHTML 重建）
    var copyBtn = document.createElement('button');
    copyBtn.textContent = '复制日志';
    copyBtn.style.cssText = [
        'background:#333', 'color:#aaa', 'border:1px solid #555',
        'border-radius:3px', 'padding:2px 8px', 'font:11px monospace',
        'cursor:pointer', 'float:right', 'margin-bottom:4px'
    ].join(';');
    copyBtn.addEventListener('click', copyLog);

    var header = document.createElement('div');
    var body   = document.createElement('div');
    panel.appendChild(header);
    panel.appendChild(copyBtn);
    panel.appendChild(body);

    function val(v) {
        if (v === null || v === undefined) return '<span style="color:#555">null</span>';
        var color = v ? '#4f4' : '#f44';
        return '<span style="color:' + color + '">' + v + '</span>';
    }

    function render(s) {
        // 头部：当前状态快照
        var h = '<span style="color:#ff0;font-weight:bold">雀魂状态监测</span>';
        h += ' <span style="color:#444;font-size:10px">Alt+M 收起</span>';
        h += '<hr style="border:none;border-top:1px solid #333;margin:5px 0">';
        h += '<b style="color:#8cf">GameMgr</b>  ';
        h += 'ingame: ' + val(s.ingame) + '  ';
        h += 'scene_mj: ' + val(s.scene_mj) + '<br>';
        h += 'game_status: <span style="color:#aaa">' + JSON.stringify(s.game_status) + '</span><br>';
        h += 'scene: <span style="color:#aaa">' + (s.scene_name || 'null') + '</span><br>';

        if (s.ingame) {
            h += '<b style="color:#f4f">Desktop</b>  ';
            h += 'gameing: ' + val(s.d_gameing) + '  ';
            h += 'started: ' + val(s.d_started) + '  ';
            h += 'active: '  + val(s.d_active)  + '<br>';
            h += 'players: <span style="color:#aaa">' + s.d_players + '</span><br>';
        }

        h += '<span style="color:#444">DOM children: ' + s.dom_children + '  mutations: ' + domMutationCount + '</span>';

        // 主脚本状态
        h += '<hr style="border:none;border-top:1px solid #333;margin:5px 0">';
        h += '<b style="color:#fa0">主脚本</b>  ';
        var nsColor = s.main_ns ? '#4f4' : '#f44';
        h += '命名空间: <span style="color:' + nsColor + '">' + (s.main_ns ? '已加载' : '未检测到') + '</span>  ';
        var stColor = '#aaa';
        if (s.main_status === 'observer-ready' || s.main_status === 'done') stColor = '#4f4';
        if (s.main_status === 'processing') stColor = '#ff0';
        if (s.main_status && s.main_status.indexOf('error') === 0) stColor = '#f44';
        h += '状态: <span style="color:' + stColor + '">' + (s.main_status || 'null') + '</span><br>';
        h += '分析卡片: <span style="color:' + (s.main_cards > 0 ? '#4f4' : '#555') + '">' + s.main_cards + '</span>';
        header.innerHTML = h;

        // 日志区（仅变化条目）
        var l = '<hr style="border:none;border-top:1px solid #333;margin:5px 0">';
        if (eventLog.length === 0) {
            l += '<span style="color:#444">等待变化...</span>';
        } else {
            for (var i = 0; i < eventLog.length; i++) {
                var e = eventLog[i];
                l += '<span style="color:#444">' + e.t + '</span> ';
                l += '<span style="color:' + e.color + '">' + e.msg + '</span><br>';
            }
        }
        body.innerHTML = l;

        // 圆点颜色同步
        var dotColor = s.ingame ? '#4f4' : (s.ingame === false ? '#f84' : '#555');
        toggle.style.background = dotColor;
        toggle.style.boxShadow  = '0 0 8px ' + dotColor;
    }

    // ─── 主循环 ───────────────────────────────────────────────────────────────

    logEvent('监测工具已启动', '#4f4');

    setInterval(function () {
        var curr = readState();
        detectChanges(prev, curr);
        render(curr);
        prev = curr;
    }, 500);

})();
