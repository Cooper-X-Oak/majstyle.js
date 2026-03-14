// ==UserScript==
// @name         雀魂金玉四麻风格分析助手
// @namespace    http://tampermonkey.net/
// @version      2.1.0
// @description  金之间/玉之间四人麻将对手风格实时分析（基于牌谱屋数据）- Phase 1 增强版
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// ==/UserScript==

(function () {
  'use strict';

  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }

  // 获取游戏窗口对象
  function getGameWindow() {
    return typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  }

  // 获取当前对局的玩家数据
  function getPlayerDatas() {
    var gameWindow = getGameWindow();
    try {
      if (gameWindow && gameWindow.view && gameWindow.view.DesktopMgr && gameWindow.view.DesktopMgr.Inst && gameWindow.view.DesktopMgr.Inst.player_datas) {
        return gameWindow.view.DesktopMgr.Inst.player_datas;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 获取当前用户的账号ID
  function getMyAccountId() {
    var gameWindow = getGameWindow();
    try {
      if (gameWindow && gameWindow.GameMgr && gameWindow.GameMgr.Inst && typeof gameWindow.GameMgr.Inst.account_id !== 'undefined') {
        return gameWindow.GameMgr.Inst.account_id;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // 探索游戏对象结构（用于数据研究）
  function exploreGameObject() {
    var gameWindow = getGameWindow();
    console.log('=== 雀魂游戏对象结构探索 ===');
    console.log('提示: 将以下结果记录到 docs/GAME_OBJECT_STRUCTURE.md');
    console.log('');

    // 探索 view 对象
    if (gameWindow.view) {
      console.log('【view 对象】');
      console.log('可用属性:', Object.keys(gameWindow.view));
      console.log('');

      // 探索 DesktopMgr
      if (gameWindow.view.DesktopMgr) {
        console.log('【view.DesktopMgr 对象】');
        console.log('可用属性:', Object.keys(gameWindow.view.DesktopMgr));
        console.log('');

        // 探索 DesktopMgr.Inst
        if (gameWindow.view.DesktopMgr.Inst) {
          console.log('【view.DesktopMgr.Inst 对象】');
          var instKeys = Object.keys(gameWindow.view.DesktopMgr.Inst);
          console.log('可用属性 (' + instKeys.length + ' 个):', instKeys);
          console.log('');

          // 探索 player_datas
          if (gameWindow.view.DesktopMgr.Inst.player_datas) {
            console.log('【player_datas 数组】');
            var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
            console.log('玩家数量:', playerDatas.length);
            if (playerDatas.length > 0) {
              console.log('第一个玩家对象的属性:', Object.keys(playerDatas[0]));
              console.log('第一个玩家数据示例:', JSON.stringify(playerDatas[0], null, 2));
            }
            console.log('');
          }
        }
      }
    } else {
      console.log('⚠️ view 对象不存在');
    }

    // 探索 GameMgr 对象
    if (gameWindow.GameMgr) {
      console.log('【GameMgr 对象】');
      console.log('可用属性:', Object.keys(gameWindow.GameMgr));
      console.log('');
      if (gameWindow.GameMgr.Inst) {
        console.log('【GameMgr.Inst 对象】');
        var gameMgrKeys = Object.keys(gameWindow.GameMgr.Inst);
        console.log('可用属性 (' + gameMgrKeys.length + ' 个):', gameMgrKeys);
        console.log('');

        // 显示一些可能有用的属性
        var interestingKeys = ['account_id', 'game_state', 'round', 'dealer', 'scores'];
        interestingKeys.forEach(function (key) {
          if (typeof gameWindow.GameMgr.Inst[key] !== 'undefined') {
            console.log('  ' + key + ':', gameWindow.GameMgr.Inst[key]);
          }
        });
        console.log('');
      }
    } else {
      console.log('⚠️ GameMgr 对象不存在');
    }

    // 探索可能的事件系统
    console.log('【事件系统探索】');
    var eventKeys = ['on', 'addEventListener', 'emit', 'trigger', 'dispatch'];
    var foundEvents = false;
    [gameWindow, gameWindow.view, gameWindow.GameMgr].forEach(function (obj, idx) {
      if (obj) {
        var objName = ['gameWindow', 'view', 'GameMgr'][idx];
        eventKeys.forEach(function (key) {
          if (typeof obj[key] === 'function') {
            console.log('  发现事件方法: ' + objName + '.' + key);
            foundEvents = true;
          }
        });
      }
    });
    if (!foundEvents) {
      console.log('  未发现明显的事件系统');
    }
    console.log('');
    console.log('=== 探索完成 ===');
    console.log('请将以上结果记录到 docs/GAME_OBJECT_STRUCTURE.md');
  }

  // GM_xmlhttpRequest 封装为 Promise 接口（带重试）
  function gmRequest(options) {
    var maxRetries = options.retries || 2;
    var retryDelay = options.retryDelay || 1000;
    function attemptRequest(retriesLeft) {
      return new Promise(function (resolve, reject) {
        var url = options.url;
        GM_xmlhttpRequest({
          method: options.method || 'GET',
          url: url,
          timeout: options.timeout || 15000,
          onload: function onload(response) {
            if (response.status === 200) {
              try {
                resolve(JSON.parse(response.responseText));
              } catch (e) {
                reject({
                  type: 'parse',
                  message: 'JSON解析失败',
                  url: url,
                  error: e
                });
              }
            } else if (response.status === 429) {
              reject({
                type: 'rate_limit',
                message: 'API速率限制',
                status: response.status,
                url: url
              });
            } else {
              reject({
                type: 'http',
                message: 'HTTP ' + response.status,
                status: response.status,
                url: url
              });
            }
          },
          onerror: function onerror() {
            reject({
              type: 'network',
              message: '网络错误',
              url: url
            });
          },
          ontimeout: function ontimeout() {
            var error = {
              type: 'timeout',
              message: '请求超时',
              url: url
            };
            if (retriesLeft > 0) {
              console.log('  [重试] 请求超时，' + retryDelay + 'ms 后重试 (剩余 ' + retriesLeft + ' 次)');
              setTimeout(function () {
                attemptRequest(retriesLeft - 1).then(resolve).catch(reject);
              }, retryDelay);
            } else {
              reject(error);
            }
          }
        });
      });
    }
    return attemptRequest(maxRetries);
  }

  // 段位基准数据
  var LEVEL_BASELINE = {
    10301: {
      name: '士3',
      立直率: 19.66,
      副露率: 35.83,
      和牌率: 21.08,
      放铳率: 17.55,
      平均打点: 6688
    },
    10401: {
      name: '杰1',
      立直率: 19.81,
      副露率: 35.44,
      和牌率: 21.55,
      放铳率: 16.81,
      平均打点: 6639
    },
    10402: {
      name: '杰2',
      立直率: 19.90,
      副露率: 34.80,
      和牌率: 22.22,
      放铳率: 15.92,
      平均打点: 6663
    },
    10403: {
      name: '杰3',
      立直率: 19.58,
      副露率: 33.74,
      和牌率: 22.25,
      放铳率: 15.08,
      平均打点: 6651
    },
    10501: {
      name: '豪1',
      立直率: 19.35,
      副露率: 32.51,
      和牌率: 22.20,
      放铳率: 14.12,
      平均打点: 6634
    },
    10502: {
      name: '豪2',
      立直率: 19.02,
      副露率: 32.06,
      和牌率: 22.04,
      放铳率: 13.49,
      平均打点: 6597
    },
    10503: {
      name: '豪3',
      立直率: 18.77,
      副露率: 32.03,
      和牌率: 22.14,
      放铳率: 12.93,
      平均打点: 6571
    },
    10601: {
      name: '圣1',
      立直率: 18.54,
      副露率: 32.04,
      和牌率: 22.14,
      放铳率: 12.45,
      平均打点: 6538
    },
    10602: {
      name: '圣2',
      立直率: 18.47,
      副露率: 32.03,
      和牌率: 22.12,
      放铳率: 12.14,
      平均打点: 6520
    },
    10603: {
      name: '圣3',
      立直率: 18.38,
      副露率: 32.36,
      和牌率: 22.37,
      放铳率: 11.73,
      平均打点: 6485
    },
    10701: {
      name: '魂1',
      立直率: 18.25,
      副露率: 32.68,
      和牌率: 22.56,
      放铳率: 11.41,
      平均打点: 6472
    }
  };

  // 默认基准（杰3）
  var DEFAULT_BASELINE = LEVEL_BASELINE[10403];

  // API 配置
  var API_CONFIG = {
    baseUrl: 'https://5-data.amae-koromo.com/api/v2/pl4',
    startTime: 1262304000000,
    params: {
      mode: '12.9',
      tag: '492541'
    }
  };

  // 分类阈值
  var THRESHOLDS = {
    进攻意愿: {
      高: 1.5,
      低: -1.5
    },
    进攻效率: {
      高: 2.0,
      低: -2
    },
    放铳率: {
      铁壁: -2,
      漏勺: 2.0
    },
    平均打点: {
      大牌: 500,
      速和: -500
    },
    追立率: {
      狂魔: 25},
    先制率: {
      先制王: 85},
    立直好型: {
      好型: 60,
      赌博: 40
    }
  };

  // 根据段位ID获取基准数据
  function getBaseline(levelId) {
    return LEVEL_BASELINE[levelId] || DEFAULT_BASELINE;
  }

  // 获取玩家基础统计数据
  function getPlayerStats(accountId) {
    var endTime = Date.now();
    var url = API_CONFIG.baseUrl + '/player_stats/' + accountId + '/' + API_CONFIG.startTime + '/' + endTime + '?mode=' + API_CONFIG.params.mode + '&tag=' + API_CONFIG.params.tag;
    return gmRequest({
      url: url
    });
  }

  // 获取玩家扩展统计数据
  function getPlayerExtendedStats(accountId) {
    var endTime = Date.now();
    var url = API_CONFIG.baseUrl + '/player_extended_stats/' + accountId + '/' + API_CONFIG.startTime + '/' + endTime + '?mode=' + API_CONFIG.params.mode + '&tag=' + API_CONFIG.params.tag;
    return gmRequest({
      url: url
    });
  }

  // 风格分析核心函数
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
    var 进攻效率 = 和牌率 / 进攻意愿 * 100;
    var 基准进攻效率 = baseline.和牌率 / 基准进攻意愿 * 100;
    var 进攻意愿偏差 = 进攻意愿 - 基准进攻意愿;
    var 进攻效率偏差 = 进攻效率 - 基准进攻效率;
    var 放铳率偏差 = 放铳率 - baseline.放铳率;
    var 打点偏差 = 平均打点 - baseline.平均打点;
    var 意愿类型, 效率类型, 防守类型, 打点类型;
    if (进攻意愿偏差 > THRESHOLDS.进攻意愿.高) 意愿类型 = '高';else if (进攻意愿偏差 < THRESHOLDS.进攻意愿.低) 意愿类型 = '低';else 意愿类型 = '中';
    if (进攻效率偏差 > THRESHOLDS.进攻效率.高) 效率类型 = '高';else if (进攻效率偏差 < THRESHOLDS.进攻效率.低) 效率类型 = '低';else 效率类型 = '中';
    if (放铳率偏差 < THRESHOLDS.放铳率.铁壁) 防守类型 = '铁壁';else if (放铳率偏差 > THRESHOLDS.放铳率.漏勺) 防守类型 = '漏勺';else 防守类型 = '正常';
    if (打点偏差 > THRESHOLDS.平均打点.大牌) 打点类型 = '大牌';else if (打点偏差 < THRESHOLDS.平均打点.速和) 打点类型 = '速和';else 打点类型 = '均衡';
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

  // 策略建议生成（增强版）
  function generateAdvice(analysis, stats) {
    return {
      危险度: calculateDangerLevel(analysis, stats),
      综合实力: assessOverallStrength(stats),
      进攻特征: analyzeOffensePattern(stats),
      防守能力: analyzeDefense(stats),
      立直质量: analyzeRiichiQuality(stats),
      副露质量: analyzeFuluQuality(stats),
      速度评估: analyzeSpeed(stats),
      隐蔽性: analyzeConcealment(stats),
      策略建议: generateStrategies(analysis, stats)
    };
  }

  // 综合实力评估（基于净打点效率）
  function assessOverallStrength(stats) {
    var netEfficiency = stats['净打点效率'] || 0;
    var level = '';
    if (netEfficiency > 500) level = '强劲';else if (netEfficiency > 0) level = '中等';else level = '较弱';
    return {
      净打点效率: netEfficiency,
      打点效率: stats['打点效率'] || 0,
      铳点损失: stats['铳点损失'] || 0,
      评价: level,
      说明: '净打点效率 = 打点效率 - 铳点损失，综合反映实力'
    };
  }

  // 隐蔽性评估（基于默听率）
  function analyzeConcealment(stats) {
    var motenRate = stats['默听率'] || 0;
    var level = '';
    if (motenRate > 0.15) level = '高隐蔽';else if (motenRate > 0.08) level = '中等';else level = '低隐蔽';
    return {
      默听率: (motenRate * 100).toFixed(1) + '%',
      评价: level,
      危险性: motenRate > 0.12 ? '需警惕无征兆进攻' : '进攻意图明显'
    };
  }

  // 速度评估（基于和了巡数）
  function analyzeSpeed(stats) {
    var avgTurn = stats['和了巡数'] || 12;
    var speed = '';
    if (avgTurn < 11) speed = '快速';else if (avgTurn < 13) speed = '中速';else speed = '慢速';
    return {
      和了巡数: avgTurn.toFixed(1),
      速度类型: speed,
      立直巡目: (stats['立直巡目'] || 0).toFixed(1),
      评价: speed === '快速' ? '抢先进攻压力大' : '有时间布局'
    };
  }

  // 立直质量评估（增强版）
  function analyzeRiichiQuality(stats) {
    var riichiProfit = stats['立直收支'] || 0;
    var riichiWinRate = stats['立直后和牌率'] || 0;
    var riichiDealRate = stats['立直后放铳率'] || 0;
    var quality = '';
    if (riichiProfit > 2000 && riichiWinRate > 0.45) quality = '高质量';else if (riichiProfit > 0) quality = '中等';else quality = '低质量';
    return {
      立直收支: riichiProfit,
      立直后和牌率: (riichiWinRate * 100).toFixed(1) + '%',
      立直后放铳率: (riichiDealRate * 100).toFixed(1) + '%',
      质量评价: quality,
      建议: quality === '高质量' ? '立直后建议立即弃牌' : '可适度对抗'
    };
  }

  // 副露质量评估（新增）
  function analyzeFuluQuality(stats) {
    var fuluWinRate = stats['副露后和牌率'] || 0;
    var fuluDealRate = stats['副露后放铳率'] || 0;
    var quality = '';
    if (fuluWinRate > 0.35 && fuluDealRate < 0.15) quality = '高效';else if (fuluWinRate > 0.28) quality = '中等';else quality = '低效';
    return {
      副露后和牌率: (fuluWinRate * 100).toFixed(1) + '%',
      副露后放铳率: (fuluDealRate * 100).toFixed(1) + '%',
      质量评价: quality,
      建议: quality === '高效' ? '副露后威胁大' : '副露后可施压'
    };
  }

  // 进攻特征分析
  function analyzeOffensePattern(stats) {
    var 立直率 = (stats['立直率'] || 0) * 100;
    var 副露率 = (stats['副露率'] || 0) * 100;
    var 自摸率 = (stats['自摸率'] || 0) * 100;
    var pattern = '';
    if (立直率 > 25 && 副露率 < 30) pattern = '立直主导';else if (副露率 > 38 && 立直率 < 20) pattern = '副露主导';else if (立直率 > 20 && 副露率 > 30) pattern = '混合进攻';else pattern = '保守进攻';
    return {
      立直率: 立直率.toFixed(1) + '%',
      副露率: 副露率.toFixed(1) + '%',
      自摸率: 自摸率.toFixed(1) + '%',
      进攻模式: pattern
    };
  }

  // 防守能力分析
  function analyzeDefense(stats) {
    var 放铳率 = (stats['放铳率'] || 0) * 100;
    var 平均铳点 = stats['平均铳点'] || 5000;
    var 被炸率 = stats['被炸率'] || 0;
    var level = '';
    if (放铳率 < 13 && 平均铳点 < 5000) level = '强';else if (放铳率 < 15) level = '中等';else level = '弱';
    return {
      放铳率: 放铳率.toFixed(1) + '%',
      平均铳点: 平均铳点,
      被炸率: (被炸率 * 100).toFixed(1) + '%',
      防守等级: level,
      大牌防守: 被炸率 > 0.1 ? '差' : '好'
    };
  }

  // 危险度计算（增强版）
  function calculateDangerLevel(analysis, stats) {
    var netEfficiency = stats['净打点效率'] || 0;
    var motenRate = stats['默听率'] || 0;
    var riichiProfit = stats['立直收支'] || 0;
    var avgDealPoint = stats['平均铳点'] || 5000;

    // 归一化到 0-10 分
    var efficiencyScore = Math.min(10, Math.max(0, (netEfficiency + 1000) / 200));
    var motenScore = motenRate * 50;
    var riichiScore = Math.min(10, Math.max(0, riichiProfit / 500));
    var dealScore = 10 - avgDealPoint / 1000;
    var dangerLevel = efficiencyScore * 0.4 + motenScore * 0.2 + riichiScore * 0.3 + dealScore * 0.1;
    dangerLevel = Math.round(Math.min(10, Math.max(0, dangerLevel)));
    var icon = '';
    var label = '';
    if (dangerLevel >= 9) {
      icon = '⚠️';
      label = '极度危险';
    } else if (dangerLevel >= 7) {
      icon = '⚡';
      label = '较为危险';
    } else if (dangerLevel >= 5) {
      icon = '➡️';
      label = '正常水平';
    } else if (dangerLevel >= 3) {
      icon = '✓';
      label = '威胁较小';
    } else {
      icon = '🎯';
      label = '送分目标';
    }
    return {
      分数: dangerLevel,
      图标: icon,
      标签: label
    };
  }

  // 综合策略建议生成
  function generateStrategies(analysis, stats) {
    var strategies = [];

    // 基于综合实力
    var netEff = stats['净打点效率'] || 0;
    if (netEff > 500) {
      strategies.push('对手综合实力强，不建议正面硬刚');
    } else if (netEff < 0) {
      strategies.push('对手综合实力弱，可以积极施压');
    }

    // 基于隐蔽性
    var motenRate = stats['默听率'] || 0;
    if (motenRate > 0.12) {
      strategies.push('对手有较高默听倾向，警惕无征兆进攻');
    }

    // 基于速度
    var avgTurn = stats['和了巡数'] || 12;
    if (avgTurn < 11) {
      strategies.push('对手速度快，需要抢先进攻');
    } else if (avgTurn > 13) {
      strategies.push('对手速度慢，有时间布局');
    }

    // 基于立直质量
    var riichiProfit = stats['立直收支'] || 0;
    if (riichiProfit > 2000) {
      strategies.push('对手立直质量高，立直后建议立即弃牌');
    } else if (riichiProfit < 0) {
      strategies.push('对手立直质量不佳，可适度对抗');
    }

    // 基于副露质量
    var fuluWinRate = stats['副露后和牌率'] || 0;
    if (fuluWinRate > 0.35) {
      strategies.push('对手副露效率高，副露后威胁大');
    } else if (fuluWinRate < 0.25) {
      strategies.push('对手副露效率低，副露后可施压');
    }

    // 基于防守能力
    var avgDealPoint = stats['平均铳点'] || 5000;
    var dealRate = (stats['放铳率'] || 0) * 100;
    if (avgDealPoint < 5000 && dealRate < 13) {
      strategies.push('对手防守能力强，需要更高牌型质量');
    } else if (dealRate > 16) {
      strategies.push('对手容易放铳，积极施压可行');
    }

    // 基于被炸率
    var bombRate = stats['被炸率'] || 0;
    if (bombRate > 0.1) {
      strategies.push('对手被炸率高，大牌防守差，可以做大牌');
    }

    // 限制建议数量（最多8条）
    return strategies.slice(0, 8);
  }

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

  // HTML 转义工具函数
  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 创建无数据提示UI
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
      var otherPositions = ['top: 120px; right: 20px;', 'top: 20px; left: 75%; transform: translateX(-50%);', 'top: 120px; left: 20px;'];
      if (typeof window.majstyleJS === 'undefined') {
        window.majstyleJS = {};
      }
      if (typeof window.majstyleJS.playerUICounter === 'undefined') {
        window.majstyleJS.playerUICounter = 0;
      }
      container.style.cssText += otherPositions[window.majstyleJS.playerUICounter % 3];
      window.majstyleJS.playerUICounter++;
    }
    var html = '<div style="color: #aaa; font-size: 10px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</div>';
    html += '<div style="color: #666; font-size: 9px; margin-top: 2px;">无牌谱数据</div>';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // 创建玩家风格信息UI
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
      var otherPositions = ['top: 120px; right: 20px;',
      // 右上角
      'top: 20px; left: 75%; transform: translateX(-50%);',
      // 顶部右侧3/4位置
      'top: 120px; left: 20px;' // 左上角
      ];
      // 使用一个全局计数器来分配位置
      if (typeof window.majstyleJS === 'undefined') {
        window.majstyleJS = {};
      }
      if (typeof window.majstyleJS.playerUICounter === 'undefined') {
        window.majstyleJS.playerUICounter = 0;
      }
      container.style.cssText += otherPositions[window.majstyleJS.playerUICounter % 3];
      window.majstyleJS.playerUICounter++;
    }
    var 标签文本 = 标签.length > 0 ? '<br><span style="color: #ffa500; font-size: 9px;">' + 标签.slice(0, 3).map(escapeHtml).join(' | ') + '</span>' : '';
    var 玩家名 = '<span style="color: #aaa; font-size: 9px; margin-left: 5px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';
    var html = '<div style="font-weight: bold; font-size: 13px; color: #ffd700; margin-bottom: 4px;">【' + escapeHtml(主称号) + '】' + 玩家名 + 标签文本 + '</div>';
    html += '<div style="line-height: 1.5; font-size: 10px;">';
    var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
    var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
    var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
    var 放铳偏差 = 偏差.放铳率.toFixed(1);
    var 打点偏差 = 偏差.打点.toFixed(0);
    html += '<div>立直: <span style="color: ' + getColor(parseFloat(立直偏差), 2) + '">' + 数据.立直率.toFixed(1) + '% (' + (立直偏差 > 0 ? '+' : '') + 立直偏差 + '%)</span></div>';
    html += '<div>副露: <span style="color: ' + getColor(parseFloat(副露偏差), 3) + '">' + 数据.副露率.toFixed(1) + '% (' + (副露偏差 > 0 ? '+' : '') + 副露偏差 + '%)</span></div>';
    html += '<div>和牌: <span style="color: ' + getColor(parseFloat(和牌偏差), 1.5) + '">' + 数据.和牌率.toFixed(1) + '% (' + (和牌偏差 > 0 ? '+' : '') + 和牌偏差 + '%)</span></div>';
    html += '<div>放铳: <span style="color: ' + getColor(parseFloat(放铳偏差), 1.5) + '">' + 数据.放铳率.toFixed(1) + '% (' + (放铳偏差 > 0 ? '+' : '') + 放铳偏差 + '%)</span></div>';
    html += '<div>打点: <span style="color: ' + getColor(parseFloat(打点偏差), 300) + '">' + 数据.平均打点 + ' (' + (打点偏差 > 0 ? '+' : '') + 打点偏差 + ')</span></div>';
    html += '</div>';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // 控制台输出详细分析
  function printAnalysis(playerData, analysis, baseline, index, isSelf, stats) {
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
    advice.策略建议.forEach(function (tip, index) {
      console.log('      ' + (index + 1) + '. ' + tip);
    });
  }

  // 处理单个玩家的完整流程
  function processPlayer(p, myId, index) {
    var isSelf = p.account_id === myId;
    console.log('');
    console.log('座位' + index + ': ' + p.nickname + ' (ID:' + p.account_id + ')' + (isSelf ? ' [你]' : ''));
    if (p.account_id <= 10) {
      console.log('  [电脑]');
      return Promise.resolve();
    }
    console.log('  [开始] 请求玩家数据...');
    return getPlayerStats(p.account_id).then(function (basicStats) {
      console.log('  [成功] 获取基础数据');

      // 验证响应结构
      if (!basicStats || _typeof(basicStats) !== 'object') {
        throw {
          type: 'validation',
          message: '无效的基础数据响应'
        };
      }
      var levelId = basicStats.level ? basicStats.level.id : null;
      var baseline = getBaseline(levelId);
      console.log('  [开始] 请求扩展数据...');
      return getPlayerExtendedStats(p.account_id).then(function (extStats) {
        console.log('  [成功] 获取扩展数据');

        // 验证扩展数据结构
        if (!extStats || _typeof(extStats) !== 'object' || typeof extStats.count !== 'number') {
          throw {
            type: 'validation',
            message: '无效的扩展数据响应'
          };
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
    }).catch(function (e) {
      var errorMsg = '  数据获取失败: ';
      if (e && _typeof(e) === 'object') {
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

  // 初始化命名空间
  if (typeof window.majstyleJS === 'undefined') {
    window.majstyleJS = {};
  }

  // 清除所有玩家信息UI
  function clearAllPlayerInfoUI() {
    var elements = document.querySelectorAll('.majsoul-style-info');
    elements.forEach(function (el) {
      el.remove();
    });
    window.majstyleJS.playerUICounter = 0;
  }

  // 重置UI计数器
  function resetPlayerUICounter() {
    window.majstyleJS.playerUICounter = 0;
  }

  (function () {

    var lastCheck = null;
    var intervalId = null;
    var isProcessing = false;
    var processingCache = new Map();

    // 清理定时器
    function cleanup() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      processingCache.clear();
    }

    // 监听页面卸载事件
    window.addEventListener('beforeunload', cleanup);

    // 数据探索模式 - Ctrl+Alt+E (Explore)
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && e.key === 'e') {
        e.preventDefault(); // 阻止默认行为
        console.log('');
        console.log('========================================');
        console.log('      数据探索模式已触发');
        console.log('      快捷键: Ctrl+Alt+E');
        console.log('========================================');
        console.log('');

        // 探索游戏对象结构
        exploreGameObject();

        // 探索当前玩家的 API 数据
        var playerDatas = getPlayerDatas();
        if (playerDatas && playerDatas.length > 0) {
          var firstPlayer = playerDatas[0];
          console.log('');
          console.log('=== 探索玩家 API 数据 ===');
          console.log('账号ID:', firstPlayer.account_id);
          console.log('正在请求 player_extended_stats...');
          console.log('');
          getPlayerExtendedStats(firstPlayer.account_id).then(function (data) {
            console.log('【player_extended_stats 完整响应】');
            console.log(JSON.stringify(data, null, 2));
            console.log('');
            console.log('【字段清单】');
            Object.keys(data).forEach(function (key) {
              var value = data[key];
              var type = _typeof(value);
              if (value === null) {
                type = 'null';
              } else if (Array.isArray(value)) {
                type = 'array[' + value.length + ']';
              }
              console.log('  ' + key + ': ' + type);
            });
            console.log('');
            console.log('请将以上结果记录到 docs/API_DATA_STRUCTURE.md');
          }).catch(function (error) {
            console.error('API 请求失败:', error);
          });
        } else {
          console.log('⚠️ 当前没有玩家数据，无法探索 API');
        }
        console.log('');
        console.log('========================================');
        console.log('提示: 使用 tools/api-explorer.html 可以更方便地探索 API');
        console.log('快捷键: Ctrl+Alt+E');
        console.log('========================================');
      }
    });
    setTimeout(function () {
      intervalId = setInterval(function () {
        try {
          // 防止重复处理
          if (isProcessing) {
            return;
          }
          var playerDatas = getPlayerDatas();
          var myId = getMyAccountId();
          if (!playerDatas || playerDatas.length === 0) {
            clearAllPlayerInfoUI();
            return;
          }
          var currentIds = playerDatas.map(function (p) {
            return p.account_id;
          }).sort().join(',');
          if (currentIds !== lastCheck) {
            lastCheck = currentIds;
            isProcessing = true;
            resetPlayerUICounter();
            console.log('========================================');
            console.log('         雀魂对手风格分析');
            console.log('========================================');
            var promises = [];
            for (var i = 0; i < playerDatas.length; i++) {
              var playerId = playerDatas[i].account_id;

              // 检查是否已有进行中的请求
              if (processingCache.has(playerId)) {
                promises.push(processingCache.get(playerId));
              } else {
                var promise = processPlayer(playerDatas[i], myId, i);
                processingCache.set(playerId, promise);

                // 请求完成后清理缓存
                promise.finally(function () {
                  processingCache.delete(playerId);
                });
                promises.push(promise);
              }
            }
            Promise.all(promises).then(function () {
              console.log('');
              console.log('========================================');
            }).catch(function (error) {
              console.error('[Promise.all 失败]', error);
            }).finally(function () {
              isProcessing = false;
            });
          }
        } catch (e) {
          console.log('[错误] ' + e.message);
          console.log(e.stack);
          isProcessing = false;
        }
      }, 1000);
    }, 2000);
  })();

})();
