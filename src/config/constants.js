import { loadConfig } from './config-loader.js';

// API 配置（待移除）
export var API_CONFIG = {
    baseUrl: 'https://5-data.amae-koromo.com/api/v2/pl4',
    startTime: 1262304000000,
    params: {
        mode: '12.9',
        tag: '492541'
    }
};

// 获取段位基准数据
export function getBaseline(levelId) {
    'use strict';

    var config = loadConfig();
    var baseline = config.level_baseline[String(levelId)];

    if (baseline) {
        return baseline;
    }

    // 返回默认基准
    var defaultLevelId = config.default_baseline_level;
    return config.level_baseline[defaultLevelId];
}
