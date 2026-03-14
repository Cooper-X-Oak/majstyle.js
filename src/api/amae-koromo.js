import { gmRequest } from './client.js';
import { API_CONFIG } from '../config/constants.js';

// 获取玩家基础统计数据
export function getPlayerStats(accountId) {
    var endTime = Date.now();
    var url = API_CONFIG.baseUrl + '/player_stats/' + accountId + '/' +
        API_CONFIG.startTime + '/' + endTime +
        '?mode=' + API_CONFIG.params.mode + '&tag=' + API_CONFIG.params.tag;

    return gmRequest({ url: url });
}

// 获取玩家扩展统计数据
export function getPlayerExtendedStats(accountId) {
    var endTime = Date.now();
    var url = API_CONFIG.baseUrl + '/player_extended_stats/' + accountId + '/' +
        API_CONFIG.startTime + '/' + endTime +
        '?mode=' + API_CONFIG.params.mode + '&tag=' + API_CONFIG.params.tag;

    return gmRequest({ url: url });
}
