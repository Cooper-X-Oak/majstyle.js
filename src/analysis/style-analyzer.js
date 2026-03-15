import { getStyleThresholds } from '../config/config-loader.js';

// 风格分析核心函数
export function analyzeStyle(stats, baseline) {
    'use strict';

    // 从配置加载阈值
    var THRESHOLDS = getStyleThresholds();

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
