// ==UserScript==
// @name         雀魂金玉四麻风格分析助手
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  金之间/玉之间四人麻将对手风格实时分析（基于牌谱屋数据）
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// ==/UserScript==

(function() {
    'use strict';

    var gameWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    var LEVEL_BASELINE = {
        10301: { name: '士3', 立直率: 19.66, 副露率: 35.83, 和牌率: 21.08, 放铳率: 17.55, 平均打点: 6688 },
        10401: { name: '杰1', 立直率: 19.81, 副露率: 35.44, 和牌率: 21.55, 放铳率: 16.81, 平均打点: 6639 },
        10402: { name: '杰2', 立直率: 19.90, 副露率: 34.80, 和牌率: 22.22, 放铳率: 15.92, 平均打点: 6663 },
        10403: { name: '杰3', 立直率: 19.58, 副露率: 33.74, 和牌率: 22.25, 放铳率: 15.08, 平均打点: 6651 },
        10501: { name: '豪1', 立直率: 19.35, 副露率: 32.51, 和牌率: 22.20, 放铳率: 14.12, 平均打点: 6634 },
        10502: { name: '豪2', 立直率: 19.02, 副露率: 32.06, 和牌率: 22.04, 放铳率: 13.49, 平均打点: 6597 },
        10503: { name: '豪3', 立直率: 18.77, 副露率: 32.03, 和牌率: 22.14, 放铳率: 12.93, 平均打点: 6571 },
        10601: { name: '圣1', 立直率: 18.54, 副露率: 32.04, 和牌率: 22.14, 放铳率: 12.45, 平均打点: 6538 },
        10602: { name: '圣2', 立直率: 18.47, 副露率: 32.03, 和牌率: 22.12, 放铳率: 12.14, 平均打点: 6520 },
        10603: { name: '圣3', 立直率: 18.38, 副露率: 32.36, 和牌率: 22.37, 放铳率: 11.73, 平均打点: 6485 },
        10701: { name: '魂1', 立直率: 18.25, 副露率: 32.68, 和牌率: 22.56, 放铳率: 11.41, 平均打点: 6472 }
    };

    var DEFAULT_BASELINE = LEVEL_BASELINE[10403];

    var THRESHOLDS = {
        进攻意愿: { 高: 1.5, 低: -1.5 },
        进攻效率: { 高: 2.0, 低: -2.0 },
        放铳率: { 铁壁: -2.0, 漏勺: 2.0 },
        平均打点: { 大牌: 500, 速和: -500 },
        追立率: { 狂魔: 25, 保守: 15 },
        先制率: { 先制王: 85, 追立型: 75 },
        立直好型: { 好型: 60, 赌博: 40 }
    };

    var lastCheck = null;

    function getBaseline(levelId) {
        return LEVEL_BASELINE[levelId] || DEFAULT_BASELINE;
    }

    function getPlayerStats(accountId) {
        return new Promise(function(resolve, reject) {
            var endTime = Date.now();
            var startTime = 1262304000000;
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch(e) {
                            reject('JSON解析失败');
                        }
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() {
                    reject('网络错误');
                },
                ontimeout: function() {
                    reject('请求超时');
                }
            });
        });
    }

    function getPlayerExtendedStats(accountId) {
        return new Promise(function(resolve, reject) {
            var endTime = Date.now();
            var startTime = 1262304000000;
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch(e) {
                            reject('JSON解析失败');
                        }
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() {
                    reject('网络错误');
                },
                ontimeout: function() {
                    reject('请求超时');
                }
            });
        });
    }

    function analyzeStyle(stats, baseline) {
        var 立直率 = stats['立直率'] * 100;
        var 副露率 = stats['副露率'] * 100;
        var 和牌率 = stats['和牌率'] * 100;
        var 放铳率 = stats['放铳率'] * 100;
        var 平均打点 = stats['平均打点'];
        var 追立率 = stats['追立率'] * 100;
        var 先制率 = stats['先制率'] * 100;
        var 立直好型 = stats['立直好型'] * 100;

        var 进攻意愿 = 立直率 + 副露率;
        var 基准进攻意愿 = baseline.立直率 + baseline.副露率;
        var 进攻效率 = (和牌率 / 进攻意愿) * 100;
        var 基准进攻效率 = (baseline.和牌率 / 基准进攻意愿) * 100;

        var 进攻意愿偏差 = 进攻意愿 - 基准进攻意愿;
        var 进攻效率偏差 = 进攻效率 - 基准进攻效率;
        var 放铳率偏差 = 放铳率 - baseline.放铳率;
        var 打点偏差 = 平均打点 - baseline.平均打点;

        var 意愿类型, 效率类型, 防守类型, 打点类型;

        if (进攻意愿偏差 > THRESHOLDS.进攻意愿.高) 意愿类型 = '高';
        else if (进攻意愿偏差 < THRESHOLDS.进攻意愿.低) 意愿类型 = '低';
        else 意愿类型 = '中';

        if (进攻效率偏差 > THRESHOLDS.进攻效率.高) 效率类型 = '高';
        else if (进攻效率偏差 < THRESHOLDS.进攻效率.低) 效率类型 = '低';
        else 效率类型 = '中';

        if (放铳率偏差 < THRESHOLDS.放铳率.铁壁) 防守类型 = '铁壁';
        else if (放铳率偏差 > THRESHOLDS.放铳率.漏勺) 防守类型 = '漏勺';
        else 防守类型 = '正常';

        if (打点偏差 > THRESHOLDS.平均打点.大牌) 打点类型 = '大牌';
        else if (打点偏差 < THRESHOLDS.平均打点.速和) 打点类型 = '速和';
        else 打点类型 = '均衡';

        var 称号映射 = {
            '高铁壁': '钢铁战士',
            '高正常': '狂战士',
            '高漏勺': '自爆兵',
            '中铁壁': '忍者',
            '中正常': '上班族',
            '中漏勺': '赌徒',
            '低铁壁': '乌龟',
            '低正常': '摆烂人',
            '低漏勺': '送分童子'
        };

        var 主称号 = 称号映射[意愿类型 + 防守类型];

        var 标签 = [];
        if (效率类型 === '高') 标签.push('精准狙击');
        if (副露率 > 38) 标签.push('速攻流');
        if (立直率 > 25) 标签.push('立直狂');
        if (打点类型 === '大牌') 标签.push('大牌猎人');
        if (追立率 > THRESHOLDS.追立率.狂魔) 标签.push('对攻狂魔');
        if (意愿类型 === '低') 标签.push('慢热型');
        if (防守类型 === '铁壁') 标签.push('铁壁');
        if (防守类型 === '漏勺') 标签.push('漏勺');
        if (先制率 > THRESHOLDS.先制率.先制王) 标签.push('先制王');
        if (立直好型 > THRESHOLDS.立直好型.好型) 标签.push('好型立直');
        if (立直好型 < THRESHOLDS.立直好型.赌博 && 立直率 > 20) 标签.push('赌博立直');

        return {
            主称号: 主称号,
            标签: 标签,
            意愿类型: 意愿类型,
            效率类型: 效率类型,
            防守类型: 防守类型,
            打点类型: 打点类型,
            数据: {
                立直率: 立直率,
                副露率: 副露率,
                和牌率: 和牌率,
                放铳率: 放铳率,
                平均打点: 平均打点,
                进攻意愿: 进攻意愿,
                进攻效率: 进攻效率,
                追立率: 追立率,
                先制率: 先制率,
                立直好型: 立直好型
            },
            偏差: {
                进攻意愿: 进攻意愿偏差,
                进攻效率: 进攻效率偏差,
                放铳率: 放铳率偏差,
                打点: 打点偏差
            }
        };
    }

    function generateAdvice(analysis) {
        var advice = [];
        var 意愿类型 = analysis.意愿类型;
        var 防守类型 = analysis.防守类型;
        var 数据 = analysis.数据;

        if (意愿类型 === '高' && 防守类型 === '漏勺') {
            advice.push('此人高意愿高放铳，属于送分型');
            advice.push('可以正常进攻，他容易放铳');
        } else if (意愿类型 === '高' && 防守类型 === '铁壁') {
            advice.push('此人高意愿低放铳，属于高手');
            advice.push('他进攻时要警惕，防守时很难攻破');
        } else if (意愿类型 === '低' && 防守类型 === '铁壁') {
            advice.push('此人低意愿低放铳，属于忍者型');
            advice.push('他立直/副露时大概率好牌，要谨慎');
        } else if (意愿类型 === '低' && 防守类型 === '漏勺') {
            advice.push('此人低意愿高放铳，容易针对');
            advice.push('他不太进攻但防守差，可以施压');
        }

        if (数据.追立率 > 25) {
            advice.push('追立率' + 数据.追立率.toFixed(1) + '%，此人敢对攻');
        }

        if (数据.立直好型 < 50 && 数据.立直率 > 20) {
            advice.push('立直好型率低但立直率高，立直质量不佳');
        }

        if (数据.平均打点 > 7500) {
            advice.push('平均打点' + 数据.平均打点 + '，警惕大牌');
        }

        return advice;
    }

    function createNoDataUI(index, nickname, isSelf) {
        var existingUI = document.getElementById('player-style-' + index);
        if (existingUI) {
            existingUI.remove();
        }

        var container = document.createElement('div');
        container.id = 'player-style-' + index;
        container.className = 'majsoul-style-info';
        container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.5); color: #888; padding: 6px 10px; border-radius: 8px; font-size: 10px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: none; width: auto; white-space: nowrap;';

        // 根据是否是自己来决定位置
        if (isSelf) {
            container.style.cssText += 'bottom: 120px; left: 20px;';
        } else {
            var otherPositions = [
                'top: 120px; right: 20px;',
                'top: 20px; left: 75%; transform: translateX(-50%);',
                'top: 120px; left: 20px;'
            ];
            if (typeof window.playerUICounter === 'undefined') {
                window.playerUICounter = 0;
            }
            container.style.cssText += otherPositions[window.playerUICounter % 3];
            window.playerUICounter++;
        }

        var html = '<div style="color: #aaa; font-size: 10px;">' + nickname + (isSelf ? ' [你]' : '') + '</div>';
        html += '<div style="color: #666; font-size: 9px; margin-top: 2px;">无牌谱数据</div>';

        container.innerHTML = html;
        document.body.appendChild(container);
    }

    function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf) {
        var existingUI = document.getElementById('player-style-' + index);
        if (existingUI) {
            existingUI.remove();
        }

        var container = document.createElement('div');
        container.id = 'player-style-' + index;
        container.className = 'majsoul-style-info';
        container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.6); color: #fff; padding: 8px 12px; border-radius: 8px; font-size: 11px; z-index: 10000; box-shadow: 0 0 10px rgba(0,0,0,0.5); pointer-events: none; width: auto;';

        // 根据是否是自己来决定位置
        var positions;
        if (isSelf) {
            // 自己固定在左下角
            positions = ['bottom: 120px; left: 20px;'];
            container.style.cssText += positions[0];
        } else {
            // 其他玩家按顺序分配到其他三个位置
            var otherPositions = [
                'top: 120px; right: 20px;',     // 右上角
                'top: 20px; left: 75%; transform: translateX(-50%);',  // 顶部右侧3/4位置
                'top: 120px; left: 20px;'       // 左上角
            ];
            // 使用一个全局计数器来分配位置
            if (typeof window.playerUICounter === 'undefined') {
                window.playerUICounter = 0;
            }
            container.style.cssText += otherPositions[window.playerUICounter % 3];
            window.playerUICounter++;
        }

        var 标签文本 = 标签.length > 0 ? '<br><span style="color: #ffa500; font-size: 9px;">' + 标签.slice(0, 3).join(' | ') + '</span>' : '';
        var 玩家名 = '<span style="color: #aaa; font-size: 9px; margin-left: 5px;">' + nickname + (isSelf ? ' [你]' : '') + '</span>';

        var html = '<div style="font-weight: bold; font-size: 13px; color: #ffd700; margin-bottom: 4px;">【' + 主称号 + '】' + 玩家名 + 标签文本 + '</div>';
        html += '<div style="line-height: 1.5; font-size: 10px;">';

        var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
        var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
        var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
        var 放铳偏差 = 偏差.放铳率.toFixed(1);
        var 打点偏差 = 偏差.打点.toFixed(0);

        // 根据偏差值计算颜色深浅
        function getColor(deviation, threshold) {
            var absValue = Math.abs(deviation);
            if (deviation > 0) {
                // 正偏差：红色，越大越红
                if (absValue > threshold * 2) return '#ff4444';
                if (absValue > threshold) return '#ff6b6b';
                return '#ff9999';
            } else if (deviation < 0) {
                // 负偏差：绿色，越大越绿
                if (absValue > threshold * 2) return '#44ff44';
                if (absValue > threshold) return '#51cf66';
                return '#99ff99';
            } else {
                return '#aaa';
            }
        }

        html += '<div>立直: <span style="color: ' + getColor(parseFloat(立直偏差), 2) + '">' + 数据.立直率.toFixed(1) + '% (' + (立直偏差 > 0 ? '+' : '') + 立直偏差 + '%)</span></div>';
        html += '<div>副露: <span style="color: ' + getColor(parseFloat(副露偏差), 3) + '">' + 数据.副露率.toFixed(1) + '% (' + (副露偏差 > 0 ? '+' : '') + 副露偏差 + '%)</span></div>';
        html += '<div>和牌: <span style="color: ' + getColor(parseFloat(和牌偏差), 1.5) + '">' + 数据.和牌率.toFixed(1) + '% (' + (和牌偏差 > 0 ? '+' : '') + 和牌偏差 + '%)</span></div>';
        html += '<div>放铳: <span style="color: ' + getColor(parseFloat(放铳偏差), 1.5) + '">' + 数据.放铳率.toFixed(1) + '% (' + (放铳偏差 > 0 ? '+' : '') + 放铳偏差 + '%)</span></div>';
        html += '<div>打点: <span style="color: ' + getColor(parseFloat(打点偏差), 300) + '">' + 数据.平均打点 + ' (' + (打点偏差 > 0 ? '+' : '') + 打点偏差 + ')</span></div>';
        html += '</div>';

        container.innerHTML = html;
        document.body.appendChild(container);
    }

    function clearAllPlayerInfoUI() {
        var elements = document.querySelectorAll('.majsoul-style-info');
        elements.forEach(function(el) {
            el.remove();
        });
        window.playerUICounter = 0;
    }

    function printAnalysis(playerData, analysis, baseline, index, isSelf) {
        var 主称号 = analysis.主称号;
        var 标签 = analysis.标签;
        var 数据 = analysis.数据;
        var 偏差 = analysis.偏差;
        var advice = generateAdvice(analysis);

        createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, playerData.nickname, isSelf);

        var 标签文本 = 标签.length > 0 ? ' [' + 标签.join(', ') + ']' : '';
        console.log('  段位: ' + baseline.name + ' | 称号: ' + 主称号 + 标签文本);
        console.log('  ');
        console.log('  【进攻】相对' + baseline.name + '平均');
        console.log('    立直率: ' + 数据.立直率.toFixed(1) + '% (' + (数据.立直率 - baseline.立直率).toFixed(1) + '%)');
        console.log('    副露率: ' + 数据.副露率.toFixed(1) + '% (' + (数据.副露率 - baseline.副露率).toFixed(1) + '%)');
        console.log('    和牌率: ' + 数据.和牌率.toFixed(1) + '% (' + (数据.和牌率 - baseline.和牌率).toFixed(1) + '%)');
        console.log('    平均打点: ' + 数据.平均打点 + ' (' + 偏差.打点.toFixed(0) + ')');
        console.log('    进攻意愿: ' + 数据.进攻意愿.toFixed(1) + '% (' + 偏差.进攻意愿.toFixed(1) + '%)');
        console.log('    进攻效率: ' + 数据.进攻效率.toFixed(1) + '%');
        console.log('  ');
        console.log('  【防守】');
        console.log('    放铳率: ' + 数据.放铳率.toFixed(1) + '% (' + 偏差.放铳率.toFixed(1) + '%)');
        console.log('  ');
        console.log('  【立直质量】');
        console.log('    追立率: ' + 数据.追立率.toFixed(1) + '%');
        console.log('    先制率: ' + 数据.先制率.toFixed(1) + '%');
        console.log('    立直好型: ' + 数据.立直好型.toFixed(1) + '%');
        console.log('  ');
        console.log('  【策略建议】');
        advice.forEach(function(line) {
            console.log('    ' + line);
        });
    }

    function processPlayer(p, myId, index) {
        var isSelf = p.account_id === myId;

        console.log('');
        console.log('座位' + index + ': ' + p.nickname + ' (ID:' + p.account_id + ')' + (isSelf ? ' [你]' : ''));

        if (p.account_id <= 10) {
            console.log('  [电脑]');
            return Promise.resolve();
        }

        return getPlayerStats(p.account_id)
            .then(function(basicStats) {
                var levelId = basicStats.level ? basicStats.level.id : null;
                var baseline = getBaseline(levelId);

                return getPlayerExtendedStats(p.account_id)
                    .then(function(extStats) {
                        if (extStats.count < 50) {
                            console.log('  数据不足（仅' + extStats.count + '局），无法分析');
                            createNoDataUI(index, p.nickname, isSelf);
                            return;
                        }

                        var analysis = analyzeStyle(extStats, baseline);
                        printAnalysis(p, analysis, baseline, index, isSelf);
                    });
            })
            .catch(function(e) {
                console.log('  数据获取失败: ' + e);
                createNoDataUI(index, p.nickname, isSelf);
            });
    }

    setTimeout(function() {
        setInterval(function() {
            try {
                var playerDatas, myId;

                try {
                    playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
                    myId = gameWindow.GameMgr.Inst.account_id;
                } catch(e) {
                    return;
                }

                if (!playerDatas || playerDatas.length === 0) {
                    clearAllPlayerInfoUI();
                    return;
                }

                var currentIds = playerDatas.map(function(p) {
                    return p.account_id;
                }).sort().join(',');

                if (currentIds !== lastCheck) {
                    lastCheck = currentIds;
                    window.playerUICounter = 0;

                console.log('========================================');
                console.log('         雀魂对手风格分析');
                console.log('========================================');

                var promises = [];
                for (var i = 0; i < playerDatas.length; i++) {
                    promises.push(processPlayer(playerDatas[i], myId, i));
                }

                Promise.all(promises).then(function() {
                    console.log('');
                    console.log('========================================');
                });
            }
        } catch(e) {
            console.log('[错误] ' + e.message);
            console.log(e.stack);
        }
        }, 1000);
    }, 2000);
})();
