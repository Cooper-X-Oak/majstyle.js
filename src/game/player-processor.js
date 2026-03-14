import { getPlayerStats, getPlayerExtendedStats } from '../api/amae-koromo.js';
import { getBaseline } from '../config/constants.js';
import { analyzeStyle } from '../analysis/style-analyzer.js';
import { generateAdvice } from '../analysis/advice-generator.js';
import { createPlayerInfoUI, createNoDataUI } from '../ui/player-info-card.js';

// 控制台输出详细分析
export function printAnalysis(playerData, analysis, baseline, index, isSelf) {
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

// 处理单个玩家的完整流程
export function processPlayer(p, myId, index) {
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
