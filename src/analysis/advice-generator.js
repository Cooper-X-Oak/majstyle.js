// 策略建议生成
export function generateAdvice(analysis) {
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
