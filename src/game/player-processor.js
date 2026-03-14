import { getPlayerStats, getPlayerExtendedStats } from '../api/amae-koromo.js';
import { getBaseline } from '../config/constants.js';
import { analyzeStyle } from '../analysis/style-analyzer.js';
import { generateAdvice } from '../analysis/advice-generator.js';
import { createPlayerInfoUI, createNoDataUI } from '../ui/player-info-card.js';

// 控制台输出详细分析
export function printAnalysis(playerData, analysis, baseline, index, isSelf, stats) {
    var 主称号 = analysis.主称号;
    var 标签 = analysis.标签;
    var 数据 = analysis.数据;
    var 偏差 = analysis.偏差;
    var advice = generateAdvice(analysis, stats);

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
    console.log('    危险度: ' + advice.危险度.图标 + ' ' + advice.危险度.分数 + '/10 - ' + advice.危险度.标签);
    console.log('  ');
    console.log('    综合实力:');
    console.log('      净打点效率: ' + advice.综合实力.净打点效率 + ' (' + advice.综合实力.评价 + ')');
    console.log('      打点效率: ' + advice.综合实力.打点效率 + ' | 铳点损失: ' + advice.综合实力.铳点损失);
    console.log('  ');
    console.log('    进攻特征:');
    console.log('      速度: ' + advice.速度评估.速度类型 + ' (和了巡数: ' + advice.速度评估.和了巡数 + ')');
    console.log('      隐蔽性: ' + advice.隐蔽性.评价 + ' (默听率: ' + advice.隐蔽性.默听率 + ')');
    console.log('  ');
    console.log('    立直质量:');
    console.log('      ' + advice.立直质量.质量评价 + ' (收支: ' + advice.立直质量.立直收支 + ')');
    console.log('      和牌率: ' + advice.立直质量.立直后和牌率 + ' | 放铳率: ' + advice.立直质量.立直后放铳率);
    console.log('  ');
    console.log('    副露质量:');
    console.log('      ' + advice.副露质量.质量评价 + ' (和牌率: ' + advice.副露质量.副露后和牌率 + ')');
    console.log('  ');
    console.log('    策略建议:');
    advice.策略建议.forEach(function(tip, index) {
        console.log('      ' + (index + 1) + '. ' + tip);
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

    console.log('  [开始] 请求玩家数据...');

    return getPlayerStats(p.account_id)
        .then(function(basicStats) {
            console.log('  [成功] 获取基础数据');

            // 验证响应结构
            if (!basicStats || typeof basicStats !== 'object') {
                throw { type: 'validation', message: '无效的基础数据响应' };
            }

            var levelId = basicStats.level ? basicStats.level.id : null;
            var baseline = getBaseline(levelId);

            console.log('  [开始] 请求扩展数据...');

            return getPlayerExtendedStats(p.account_id)
                .then(function(extStats) {
                    console.log('  [成功] 获取扩展数据');

                    // 验证扩展数据结构
                    if (!extStats || typeof extStats !== 'object' || typeof extStats.count !== 'number') {
                        throw { type: 'validation', message: '无效的扩展数据响应' };
                    }

                    if (extStats.count < 50) {
                        console.log('  数据不足（仅' + extStats.count + '局），无法分析');
                        createNoDataUI(index, p.nickname, isSelf);
                        return;
                    }

                    // 调试：打印收到的字段
                    console.log('  [调试] API 返回的字段数量:', Object.keys(extStats).length);
                    console.log('  [调试] 关键字段检查:');
                    console.log('    净打点效率:', extStats['净打点效率']);
                    console.log('    默听率:', extStats['默听率']);
                    console.log('    立直收支:', extStats['立直收支']);
                    console.log('    和了巡数:', extStats['和了巡数']);

                    var analysis = analyzeStyle(extStats, baseline);
                    printAnalysis(p, analysis, baseline, index, isSelf, extStats);
                });
        })
        .catch(function(e) {
            var errorMsg = '  数据获取失败: ';
            if (e && typeof e === 'object') {
                if (e.type === 'rate_limit') {
                    errorMsg += 'API速率限制，请稍后重试';
                } else if (e.type === 'timeout') {
                    errorMsg += '请求超时（已重试）';
                    console.log('  [调试] 超时URL:', e.url);
                } else if (e.type === 'network') {
                    errorMsg += '网络连接失败';
                } else if (e.type === 'validation') {
                    errorMsg += e.message;
                } else {
                    errorMsg += e.message || String(e);
                }
            } else {
                errorMsg += String(e);
            }
            console.log(errorMsg);
            createNoDataUI(index, p.nickname, isSelf);
        });
}
