import { gmRequest } from './client.js';

// 获取玩家基础统计数据
export function getPlayerStats(accountId) {
    var endTime = Date.now();
    var startTime = 1262304000000;
    var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

    return gmRequest({ url: url });
}

// 获取玩家扩展统计数据
export function getPlayerExtendedStats(accountId) {
    var endTime = Date.now();
    var startTime = 1262304000000;
    var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

    return gmRequest({ url: url });
}
