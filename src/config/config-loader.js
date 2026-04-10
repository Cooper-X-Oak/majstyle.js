// 配置加载器模块
// 负责加载和管理 analysis-config.json 配置文件

import analysisConfig from './analysis-config.json';

// 配置缓存
var configCache = null;

// 加载配置
export function loadConfig() {
    'use strict';

    if (configCache) {
        return configCache;
    }

    // 尝试从 localStorage 加载用户自定义配置
    var customConfig = loadCustomConfig();

    // 合并默认配置和自定义配置
    configCache = mergeConfig(analysisConfig, customConfig);

    // 验证配置完整性
    validateConfig(configCache);

    return configCache;
}

// 从 localStorage 加载自定义配置
function loadCustomConfig() {
    'use strict';

    try {
        var customConfigStr = localStorage.getItem('majstyle_custom_config');
        if (customConfigStr) {
            return JSON.parse(customConfigStr);
        }
    } catch (e) {
        console.warn('[配置加载器] 加载自定义配置失败:', e);
    }

    return null;
}

// 合并配置（深度合并）
function mergeConfig(defaultConfig, customConfig) {
    'use strict';

    if (!customConfig) {
        return JSON.parse(JSON.stringify(defaultConfig));
    }

    var merged = JSON.parse(JSON.stringify(defaultConfig));

    // 深度合并
    for (var key in customConfig) {
        if (customConfig.hasOwnProperty(key)) {
            if (typeof customConfig[key] === 'object' && !Array.isArray(customConfig[key])) {
                merged[key] = mergeConfig(merged[key] || {}, customConfig[key]);
            } else {
                merged[key] = customConfig[key];
            }
        }
    }

    return merged;
}

// 验证配置完整性
function validateConfig(config) {
    'use strict';

    var requiredFields = ['version', 'dimensions', 'archetypes', 'danger_weights', 'style_thresholds'];

    for (var i = 0; i < requiredFields.length; i++) {
        if (!config[requiredFields[i]]) {
            throw new Error('[配置加载器] 配置缺少必需字段: ' + requiredFields[i]);
        }
    }

    console.log('[配置加载器] 配置验证通过，版本:', config.version);
}

// 保存自定义配置到 localStorage
export function saveCustomConfig(customConfig) {
    'use strict';

    try {
        localStorage.setItem('majstyle_custom_config', JSON.stringify(customConfig));
        // 清除缓存，强制重新加载
        configCache = null;
        console.log('[配置加载器] 自定义配置已保存');
        return true;
    } catch (e) {
        console.error('[配置加载器] 保存自定义配置失败:', e);
        return false;
    }
}

// 清除自定义配置
export function clearCustomConfig() {
    'use strict';

    try {
        localStorage.removeItem('majstyle_custom_config');
        configCache = null;
        console.log('[配置加载器] 自定义配置已清除');
        return true;
    } catch (e) {
        console.error('[配置加载器] 清除自定义配置失败:', e);
        return false;
    }
}

// 获取配置项
export function getConfigValue(path) {
    'use strict';

    var config = loadConfig();
    var keys = path.split('.');
    var value = config;

    for (var i = 0; i < keys.length; i++) {
        if (value && value.hasOwnProperty(keys[i])) {
            value = value[keys[i]];
        } else {
            return undefined;
        }
    }

    return value;
}

// 获取维度配置
export function getDimensionConfig(dimensionKey) {
    'use strict';

    return getConfigValue('dimensions.' + dimensionKey);
}

// 获取原型配置
export function getArchetypeConfig(archetypeKey) {
    'use strict';

    return getConfigValue('archetypes.' + archetypeKey);
}

// 获取危险度权重
export function getDangerWeights() {
    'use strict';

    return getConfigValue('danger_weights');
}

// 获取危险度归一化范围
export function getDangerNormalization() {
    'use strict';

    return getConfigValue('danger_normalization');
}

// 获取风格阈值
export function getStyleThresholds() {
    'use strict';

    return getConfigValue('style_thresholds');
}

// 获取强度等级配置
export function getStrengthLevels(type) {
    'use strict';

    return getConfigValue('strength_levels.' + type);
}

// 获取置信度阈值
export function getConfidenceThresholds() {
    'use strict';

    return getConfigValue('confidence_thresholds');
}

// 热更新配置（用于调试）
export function hotReloadConfig() {
    'use strict';

    configCache = null;
    return loadConfig();
}
