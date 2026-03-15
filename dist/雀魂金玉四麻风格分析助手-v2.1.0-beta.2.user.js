// ==UserScript==
// @name         雀魂金玉四麻风格分析助手
// @namespace    http://tampermonkey.net/
// @version      2.1.0-beta.2
// @description  金之间/玉之间四人麻将对手风格实时分析（基于牌谱屋数据）- Phase 1 可解释性增强
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

  // 玩家原型定义（6种核心原型）
  var ARCHETYPES = {
    RIICHI_SPECIALIST: {
      name: '立直专家',
      icon: '🎯',
      conditions: {
        立直率: {
          min: 25
        },
        立直收支: {
          min: 1500
        },
        副露率: {
          max: 30
        }
      }
    },
    FULU_SPECIALIST: {
      name: '副露专家',
      icon: '⚡',
      conditions: {
        副露率: {
          min: 38
        },
        副露后和牌率: {
          min: 0.30
        },
        立直率: {
          max: 20
        }
      }
    },
    SILENT_HUNTER: {
      name: '默听猎手',
      icon: '🥷',
      conditions: {
        默听率: {
          min: 0.15
        },
        立直率: {
          max: 20
        },
        放铳率: {
          max: 14
        }
      }
    },
    SPEED_DEMON: {
      name: '速攻型',
      icon: '💨',
      conditions: {
        和了巡数: {
          max: 11
        },
        副露率: {
          min: 35
        },
        和牌率: {
          min: 21
        }
      }
    },
    VALUE_MAXIMIZER: {
      name: '价值型',
      icon: '💎',
      conditions: {
        平均打点: {
          min: 7000
        },
        立直率: {
          min: 20
        },
        和了巡数: {
          min: 12
        }
      }
    },
    DEFENSIVE_FORTRESS: {
      name: '防守型',
      icon: '🛡️',
      conditions: {
        放铳率: {
          max: 13
        },
        被炸率: {
          max: 0.08
        },
        默听率: {
          min: 0.12
        }
      }
    }
  };

  // 危险度评分权重配置（10维度）
  var DANGER_WEIGHTS = {
    净打点效率: 0.30,
    默听率: 0.15,
    立直收支: 0.20,
    平均铳点: 0.05,
    被炸率: 0.10,
    和了巡数: 0.10,
    立直后和牌率: 0.05,
    副露后和牌率: 0.03,
    和牌率: 0.02
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

  // 玩家原型检测模块

  // 检测玩家原型
  function detectArchetype(stats) {
    var matches = [];

    // 遍历所有原型定义
    for (var key in ARCHETYPES) {
      if (ARCHETYPES.hasOwnProperty(key)) {
        var archetype = ARCHETYPES[key];
        var score = calculateArchetypeMatch(stats, archetype.conditions);
        if (score > 0) {
          matches.push({
            name: archetype.name,
            icon: archetype.icon,
            score: score,
            key: key
          });
        }
      }
    }

    // 按匹配度排序
    matches.sort(function (a, b) {
      return b.score - a.score;
    });

    // 返回最匹配的原型，如果没有匹配则返回null
    return matches.length > 0 ? matches[0] : null;
  }

  // 计算原型匹配度
  function calculateArchetypeMatch(stats, conditions) {
    var totalConditions = 0;
    var metConditions = 0;
    var overallScore = 0;
    for (var field in conditions) {
      if (conditions.hasOwnProperty(field)) {
        totalConditions++;
        var condition = conditions[field];
        var value = stats[field];

        // 处理百分比字段（需要转换）
        if (field === '立直率' || field === '副露率' || field === '放铳率' || field === '和牌率') {
          value = value * 100;
        }
        var met = true;
        var deviation = 0;

        // 检查最小值条件
        if (condition.min !== undefined) {
          if (value >= condition.min) {
            deviation = (value - condition.min) / condition.min;
          } else {
            met = false;
            deviation = (condition.min - value) / condition.min;
          }
        }

        // 检查最大值条件
        if (condition.max !== undefined) {
          if (value <= condition.max) {
            deviation = (condition.max - value) / condition.max;
          } else {
            met = false;
            deviation = (value - condition.max) / condition.max;
          }
        }
        if (met) {
          metConditions++;
          // 超出条件越多，得分越高
          overallScore += 1 + Math.min(deviation, 0.5);
        } else {
          // 未满足条件，扣分
          overallScore -= deviation;
        }
      }
    }

    // 必须满足所有条件才算匹配
    if (metConditions < totalConditions) {
      return 0;
    }
    return overallScore;
  }

  // 获取原型的战术建议
  function getArchetypeAdvice(archetypeKey) {
    var adviceMap = {
      RIICHI_SPECIALIST: ['对手立直质量高，立直后建议立即弃牌', '警惕对手的好型立直，避免放铳大牌', '对手不擅长副露，可以通过鸣牌抢先'],
      FULU_SPECIALIST: ['对手副露效率高，副露后威胁大', '注意对手的速攻倾向，需要抢先进攻', '对手立直较少，可以通过立直施压'],
      SILENT_HUNTER: ['对手有高默听倾向，警惕无征兆进攻', '对手防守能力强，需要更高牌型质量', '难以通过立直/副露判断对手听牌状态'],
      SPEED_DEMON: ['对手速度极快，需要抢先进攻', '对手倾向速和小牌，可以做大牌反制', '警惕对手的快速副露进攻'],
      VALUE_MAXIMIZER: ['对手倾向做大牌，防守时要特别小心', '对手速度较慢，有时间布局和抢先', '对手立直质量高，立直后建议弃牌'],
      DEFENSIVE_FORTRESS: ['对手防守能力极强，难以放铳', '对手倾向默听，进攻意图不明显', '需要更高的牌型质量才能有效施压']
    };
    return adviceMap[archetypeKey] || [];
  }

  // 策略建议生成（增强版）
  function generateAdvice(analysis, stats) {
    var archetype = detectArchetype(stats);
    return {
      危险度: calculateDangerLevel(analysis, stats),
      原型: archetype,
      综合实力: assessOverallStrength(stats),
      进攻特征: analyzeOffensePattern(stats),
      防守能力: analyzeDefense(stats),
      立直质量: analyzeRiichiQuality(stats),
      副露质量: analyzeFuluQuality(stats),
      速度评估: analyzeSpeed(stats),
      隐蔽性: analyzeConcealment(stats),
      策略建议: generateStrategies(analysis, stats, archetype)
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

  // 危险度计算（增强版 - 10维度）
  function calculateDangerLevel(analysis, stats) {
    var scores = {};
    var totalWeight = 0;
    var weightedSum = 0;

    // 1. 净打点效率 (30% 权重) - 综合实力指标
    var netEfficiency = stats['净打点效率'] || 0;
    scores.净打点效率 = normalizeScore(netEfficiency, -1e3, 2000, 0, 10);
    weightedSum += scores.净打点效率 * DANGER_WEIGHTS.净打点效率;
    totalWeight += DANGER_WEIGHTS.净打点效率;

    // 2. 默听率 (15% 权重) - 隐蔽性/危险性
    var motenRate = stats['默听率'] || 0;
    scores.默听率 = motenRate * 50; // 0.2 = 10分
    weightedSum += scores.默听率 * DANGER_WEIGHTS.默听率;
    totalWeight += DANGER_WEIGHTS.默听率;

    // 3. 立直收支 (20% 权重) - 立直质量
    var riichiProfit = stats['立直收支'] || 0;
    scores.立直收支 = normalizeScore(riichiProfit, -1e3, 3000, 0, 10);
    weightedSum += scores.立直收支 * DANGER_WEIGHTS.立直收支;
    totalWeight += DANGER_WEIGHTS.立直收支;

    // 4. 平均铳点 (5% 权重) - 防守弱点（反向）
    var avgDealPoint = stats['平均铳点'] || 5000;
    scores.平均铳点 = 10 - normalizeScore(avgDealPoint, 4000, 6000, 0, 10);
    weightedSum += scores.平均铳点 * DANGER_WEIGHTS.平均铳点;
    totalWeight += DANGER_WEIGHTS.平均铳点;

    // 5. 被炸率 (10% 权重) - 大牌防守能力（反向）
    var bombRate = stats['被炸率'] || 0;
    scores.被炸率 = 10 - bombRate * 100; // 0.1 = 0分
    weightedSum += scores.被炸率 * DANGER_WEIGHTS.被炸率;
    totalWeight += DANGER_WEIGHTS.被炸率;

    // 6. 和了巡数 (10% 权重) - 速度（反向）
    var avgTurn = stats['和了巡数'] || 12;
    scores.和了巡数 = 10 - normalizeScore(avgTurn, 9, 14, 0, 10);
    weightedSum += scores.和了巡数 * DANGER_WEIGHTS.和了巡数;
    totalWeight += DANGER_WEIGHTS.和了巡数;

    // 7. 立直后和牌率 (5% 权重) - 立直效率
    var riichiWinRate = stats['立直后和牌率'] || 0;
    scores.立直后和牌率 = riichiWinRate * 20; // 0.5 = 10分
    weightedSum += scores.立直后和牌率 * DANGER_WEIGHTS.立直后和牌率;
    totalWeight += DANGER_WEIGHTS.立直后和牌率;

    // 8. 副露后和牌率 (3% 权重) - 副露效率
    var fuluWinRate = stats['副露后和牌率'] || 0;
    scores.副露后和牌率 = fuluWinRate * 25; // 0.4 = 10分
    weightedSum += scores.副露后和牌率 * DANGER_WEIGHTS.副露后和牌率;
    totalWeight += DANGER_WEIGHTS.副露后和牌率;

    // 9. 和牌率 (2% 权重) - 基础进攻能力
    var winRate = (stats['和牌率'] || 0) * 100;
    scores.和牌率 = normalizeScore(winRate, 18, 26, 0, 10);
    weightedSum += scores.和牌率 * DANGER_WEIGHTS.和牌率;
    totalWeight += DANGER_WEIGHTS.和牌率;

    // 10. 样本量置信度调整
    var sampleSize = stats['count'] || 0;
    var confidenceMultiplier = calculateConfidence(sampleSize);

    // 计算最终危险度
    var dangerLevel = weightedSum / totalWeight * confidenceMultiplier;
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
      标签: label,
      置信度: (confidenceMultiplier * 100).toFixed(0) + '%',
      维度得分: scores
    };
  }

  // 归一化分数到指定范围
  function normalizeScore(value, min, max, outMin, outMax) {
    var normalized = (value - min) / (max - min);
    normalized = Math.min(1, Math.max(0, normalized));
    return outMin + normalized * (outMax - outMin);
  }

  // 计算样本量置信度
  function calculateConfidence(sampleSize) {
    if (sampleSize >= 400) return 1.0;
    if (sampleSize >= 200) return 0.95;
    if (sampleSize >= 100) return 0.90;
    if (sampleSize >= 50) return 0.80;
    return 0.70;
  }

  // 综合策略建议生成（增强版 - 结构化建议）
  function generateStrategies(analysis, stats, archetype) {
    var strategies = [];

    // 优先添加原型特定建议
    if (archetype) {
      var archetypeAdvice = getArchetypeAdvice(archetype.key);
      for (var i = 0; i < archetypeAdvice.length; i++) {
        strategies.push({
          建议: archetypeAdvice[i],
          理由: explainArchetypeAdvice(archetype, stats),
          置信度: calculateAdviceConfidence(stats),
          优先级: 1,
          来源: '玩家原型'
        });
      }
    }

    // 基于综合实力
    var netEff = stats['净打点效率'] || 0;
    if (netEff > 500) {
      strategies.push({
        建议: '对手综合实力强，不建议正面硬刚',
        理由: explainOverallStrength(stats, netEff, true),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(netEff, 500, 2000),
        来源: '综合实力'
      });
    } else if (netEff < 0) {
      strategies.push({
        建议: '对手综合实力弱，可以积极施压',
        理由: explainOverallStrength(stats, netEff, false),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(Math.abs(netEff), 0, 1000),
        来源: '综合实力'
      });
    }

    // 基于隐蔽性
    var motenRate = stats['默听率'] || 0;
    if (motenRate > 0.12 && !archetype) {
      strategies.push({
        建议: '对手有较高默听倾向，警惕无征兆进攻',
        理由: explainConcealment(stats, motenRate),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(motenRate, 0.12, 0.20),
        来源: '隐蔽性'
      });
    }

    // 基于速度
    var avgTurn = stats['和了巡数'] || 12;
    if (avgTurn < 11 && !archetype) {
      strategies.push({
        建议: '对手速度快，需要抢先进攻',
        理由: explainSpeed(stats, avgTurn, true),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(11 - avgTurn, 0, 3),
        来源: '速度评估'
      });
    } else if (avgTurn > 13) {
      strategies.push({
        建议: '对手速度慢，有时间布局',
        理由: explainSpeed(stats, avgTurn, false),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(avgTurn - 13, 0, 3),
        来源: '速度评估'
      });
    }

    // 基于立直质量
    var riichiProfit = stats['立直收支'] || 0;
    if (riichiProfit > 2000 && !archetype) {
      strategies.push({
        建议: '对手立直质量高，立直后建议立即弃牌',
        理由: explainRiichiQuality(stats, riichiProfit, true),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(riichiProfit, 2000, 4000),
        来源: '立直质量'
      });
    } else if (riichiProfit < 0) {
      strategies.push({
        建议: '对手立直质量不佳，可适度对抗',
        理由: explainRiichiQuality(stats, riichiProfit, false),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(Math.abs(riichiProfit), 0, 1000),
        来源: '立直质量'
      });
    }

    // 基于副露质量
    var fuluWinRate = stats['副露后和牌率'] || 0;
    if (fuluWinRate > 0.35 && !archetype) {
      strategies.push({
        建议: '对手副露效率高，副露后威胁大',
        理由: explainFuluQuality(stats, fuluWinRate, true),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(fuluWinRate, 0.35, 0.45),
        来源: '副露质量'
      });
    } else if (fuluWinRate < 0.25) {
      strategies.push({
        建议: '对手副露效率低，副露后可施压',
        理由: explainFuluQuality(stats, fuluWinRate, false),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(0.25 - fuluWinRate, 0, 0.10),
        来源: '副露质量'
      });
    }

    // 基于防守能力
    var avgDealPoint = stats['平均铳点'] || 5000;
    var dealRate = (stats['放铳率'] || 0) * 100;
    if (avgDealPoint < 5000 && dealRate < 13 && !archetype) {
      strategies.push({
        建议: '对手防守能力强，需要更高牌型质量',
        理由: explainDefense(stats, dealRate, avgDealPoint, true),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(13 - dealRate, 0, 5),
        来源: '防守能力'
      });
    } else if (dealRate > 16) {
      strategies.push({
        建议: '对手容易放铳，积极施压可行',
        理由: explainDefense(stats, dealRate, avgDealPoint, false),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(dealRate - 16, 0, 5),
        来源: '防守能力'
      });
    }

    // 基于被炸率
    var bombRate = stats['被炸率'] || 0;
    if (bombRate > 0.1) {
      strategies.push({
        建议: '对手被炸率高，大牌防守差，可以做大牌',
        理由: explainBombRate(stats, bombRate),
        置信度: calculateAdviceConfidence(stats),
        优先级: calculatePriority(bombRate, 0.1, 0.15),
        来源: '大牌防守'
      });
    }

    // 按优先级排序并去重
    strategies.sort(function (a, b) {
      return b.优先级 - a.优先级;
    });
    var uniqueStrategies = [];
    var seenAdvice = {};
    for (var i = 0; i < strategies.length && uniqueStrategies.length < 8; i++) {
      if (!seenAdvice[strategies[i].建议]) {
        uniqueStrategies.push(strategies[i]);
        seenAdvice[strategies[i].建议] = true;
      }
    }
    return uniqueStrategies;
  }

  // ========== 建议解释函数 ==========

  // 计算建议优先级（基于偏差程度）
  function calculatePriority(deviation, minThreshold, maxThreshold) {
    var normalized = (deviation - minThreshold) / (maxThreshold - minThreshold);
    normalized = Math.min(1, Math.max(0, normalized));
    return Math.round(normalized * 10);
  }

  // 计算建议置信度
  function calculateAdviceConfidence(stats) {
    var sampleSize = stats['count'] || 0;
    var confidence = calculateConfidence(sampleSize);
    var label = '';
    if (confidence >= 0.95) label = '高';else if (confidence >= 0.85) label = '中';else label = '低';
    return label + '（' + sampleSize + '局）';
  }

  // 解释综合实力评估
  function explainOverallStrength(stats, netEff, isStrong) {
    var 打点效率 = stats['打点效率'] || 0;
    var 铳点损失 = stats['铳点损失'] || 0;
    var 和牌率 = ((stats['和牌率'] || 0) * 100).toFixed(1);
    var 放铳率 = ((stats['放铳率'] || 0) * 100).toFixed(1);
    var explanation = {
      触发条件: isStrong ? '净打点效率 ' + netEff + ' > 阈值 500' : '净打点效率 ' + netEff + ' < 阈值 0',
      数据支撑: '打点效率 ' + 打点效率 + ' - 铳点损失 ' + 铳点损失 + ' = 净打点效率 ' + netEff + '；和牌率 ' + 和牌率 + '%，放铳率 ' + 放铳率 + '%',
      推理逻辑: isStrong ? '净打点效率显著为正，说明对手每局平均得点远超失点，综合实力强劲' : '净打点效率为负，说明对手每局平均失点大于得点，综合实力较弱',
      战术含义: isStrong ? '对手在进攻和防守上都有优势，正面对抗期望值不利，建议采取保守策略' : '对手在进攻或防守上存在明显弱点，可以通过积极施压获取优势'
    };
    return explanation;
  }

  // 解释隐蔽性评估
  function explainConcealment(stats, motenRate) {
    var 立直率 = ((stats['立直率'] || 0) * 100).toFixed(1);
    var 副露率 = ((stats['副露率'] || 0) * 100).toFixed(1);
    var 和牌率 = ((stats['和牌率'] || 0) * 100).toFixed(1);
    return {
      触发条件: '默听率 ' + (motenRate * 100).toFixed(1) + '% > 阈值 12%',
      数据支撑: '默听率 ' + (motenRate * 100).toFixed(1) + '%，立直率 ' + 立直率 + '%，副露率 ' + 副露率 + '%，和牌率 ' + 和牌率 + '%',
      推理逻辑: '默听率 = (和牌率 - 立直率 - 副露率)，高默听率说明对手经常不鸣牌、不立直而直接和牌',
      战术含义: '对手擅长隐蔽听牌，可能在无明显征兆时突然和牌，需要全程保持警惕，不能因为对手未立直就放松防守'
    };
  }

  // 解释速度评估
  function explainSpeed(stats, avgTurn, isFast) {
    var 副露率 = ((stats['副露率'] || 0) * 100).toFixed(1);
    var 副露巡目 = (stats['副露巡目'] || 0).toFixed(1);
    var 立直巡目 = (stats['立直巡目'] || 0).toFixed(1);
    return {
      触发条件: isFast ? '和了巡数 ' + avgTurn.toFixed(1) + ' < 阈值 11' : '和了巡数 ' + avgTurn.toFixed(1) + ' > 阈值 13',
      数据支撑: '和了巡数 ' + avgTurn.toFixed(1) + '，副露率 ' + 副露率 + '%，副露巡目 ' + 副露巡目 + '，立直巡目 ' + 立直巡目,
      推理逻辑: isFast ? '和了巡数显著低于平均（12巡），说明对手能快速完成听牌和和牌' : '和了巡数显著高于平均（12巡），说明对手倾向于慢速布局或追求高打点',
      战术含义: isFast ? '对手速攻压力大，需要在前期就做好防守准备，或者通过更快的速度抢先和牌' : '对手速度慢，给我方留出了充足的布局时间，可以追求更高的牌型价值'
    };
  }

  // 解释立直质量
  function explainRiichiQuality(stats, riichiProfit, isHigh) {
    var 立直后和牌率 = ((stats['立直后和牌率'] || 0) * 100).toFixed(1);
    var 立直后放铳率 = ((stats['立直后放铳率'] || 0) * 100).toFixed(1);
    var 立直率 = ((stats['立直率'] || 0) * 100).toFixed(1);
    var 平均打点 = stats['平均打点'] || 0;
    return {
      触发条件: isHigh ? '立直收支 ' + riichiProfit + ' > 阈值 2000' : '立直收支 ' + riichiProfit + ' < 阈值 0',
      数据支撑: '立直收支 ' + riichiProfit + '，立直后和牌率 ' + 立直后和牌率 + '%，立直后放铳率 ' + 立直后放铳率 + '%，立直率 ' + 立直率 + '%，平均打点 ' + 平均打点,
      推理逻辑: isHigh ? '立直收支 = 立直后和牌得点 - 立直后放铳失点，高收支意味着立直后和牌率高、放铳率低、打点可能较大' : '立直收支为负，说明对手立直后失点大于得点，可能存在过度立直或立直时机判断不佳的问题',
      战术含义: isHigh ? '对手立直质量优秀，立直后威胁极大，放铳期望损失约 7000-8000 点，建议立即切换到防守模式' : '对手立直质量不佳，立直后威胁有限，可以适度对抗，不必过度防守'
    };
  }

  // 解释副露质量
  function explainFuluQuality(stats, fuluWinRate, isHigh) {
    var 副露后放铳率 = ((stats['副露后放铳率'] || 0) * 100).toFixed(1);
    var 副露率 = ((stats['副露率'] || 0) * 100).toFixed(1);
    var 副露巡目 = (stats['副露巡目'] || 0).toFixed(1);
    return {
      触发条件: isHigh ? '副露后和牌率 ' + (fuluWinRate * 100).toFixed(1) + '% > 阈值 35%' : '副露后和牌率 ' + (fuluWinRate * 100).toFixed(1) + '% < 阈值 25%',
      数据支撑: '副露后和牌率 ' + (fuluWinRate * 100).toFixed(1) + '%，副露后放铳率 ' + 副露后放铳率 + '%，副露率 ' + 副露率 + '%，副露巡目 ' + 副露巡目,
      推理逻辑: isHigh ? '副露后和牌率显著高于平均（28-30%），说明对手擅长判断副露时机，副露后能高效完成和牌' : '副露后和牌率显著低于平均（28-30%），说明对手副露判断不佳，副露后容易陷入困境',
      战术含义: isHigh ? '对手副露后威胁大，需要警惕对手通过副露抢先和牌，可以通过立直施压' : '对手副露效率低，副露后可以积极施压，迫使对手陷入不利局面'
    };
  }

  // 解释防守能力
  function explainDefense(stats, dealRate, avgDealPoint, isStrong) {
    var 被炸率 = ((stats['被炸率'] || 0) * 100).toFixed(1);
    var 默听率 = ((stats['默听率'] || 0) * 100).toFixed(1);
    return {
      触发条件: isStrong ? '放铳率 ' + dealRate.toFixed(1) + '% < 13% 且 平均铳点 ' + avgDealPoint + ' < 5000' : '放铳率 ' + dealRate.toFixed(1) + '% > 16%',
      数据支撑: '放铳率 ' + dealRate.toFixed(1) + '%，平均铳点 ' + avgDealPoint + '，被炸率 ' + 被炸率 + '%，默听率 ' + 默听率 + '%',
      推理逻辑: isStrong ? '放铳率低且平均铳点小，说明对手防守意识强，能有效避免放铳，即使放铳也多为小牌' : '放铳率显著高于平均（14-15%），说明对手防守能力弱，容易放铳',
      战术含义: isStrong ? '对手防守能力强，难以通过普通牌型让对手放铳，需要更高的牌型质量才能获利' : '对手容易放铳，可以通过积极进攻施压，增加对手放铳概率'
    };
  }

  // 解释被炸率
  function explainBombRate(stats, bombRate) {
    var 平均铳点 = stats['平均铳点'] || 0;
    var 放铳率 = ((stats['放铳率'] || 0) * 100).toFixed(1);
    return {
      触发条件: '被炸率 ' + (bombRate * 100).toFixed(1) + '% > 阈值 10%',
      数据支撑: '被炸率 ' + (bombRate * 100).toFixed(1) + '%，平均铳点 ' + 平均铳点 + '，放铳率 ' + 放铳率 + '%',
      推理逻辑: '被炸率 = 满贯以上放铳次数 / 总放铳次数，高被炸率说明对手对大牌的防守能力差',
      战术含义: '对手对大牌防守差，可以追求高打点牌型（满贯、跳满、倍满），对手放铳概率较高'
    };
  }

  // 解释玩家原型建议
  function explainArchetypeAdvice(archetype, stats) {
    var conditions = [];
    var archetypeData = null;

    // 从 constants.js 导入的 ARCHETYPES 中查找
    var ARCHETYPES_LOCAL = {
      RIICHI_SPECIALIST: {
        name: '立直专家',
        conditions: {
          立直率: {
            min: 25
          },
          立直收支: {
            min: 1500
          },
          副露率: {
            max: 30
          }
        }
      },
      FULU_SPECIALIST: {
        name: '副露专家',
        conditions: {
          副露率: {
            min: 38
          },
          副露后和牌率: {
            min: 0.30
          },
          立直率: {
            max: 20
          }
        }
      },
      SILENT_HUNTER: {
        name: '默听猎手',
        conditions: {
          默听率: {
            min: 0.15
          },
          立直率: {
            max: 20
          },
          放铳率: {
            max: 14
          }
        }
      },
      SPEED_DEMON: {
        name: '速攻型',
        conditions: {
          和了巡数: {
            max: 11
          },
          副露率: {
            min: 35
          },
          和牌率: {
            min: 21
          }
        }
      },
      VALUE_MAXIMIZER: {
        name: '价值型',
        conditions: {
          平均打点: {
            min: 7000
          },
          立直率: {
            min: 20
          },
          和了巡数: {
            min: 12
          }
        }
      },
      DEFENSIVE_FORTRESS: {
        name: '防守型',
        conditions: {
          放铳率: {
            max: 13
          },
          被炸率: {
            max: 0.08
          },
          默听率: {
            min: 0.12
          }
        }
      }
    };
    archetypeData = ARCHETYPES_LOCAL[archetype.key];
    if (!archetypeData) {
      return {
        触发条件: '匹配玩家原型: ' + archetype.name,
        数据支撑: '基于多维度数据综合判断',
        推理逻辑: '玩家行为模式符合该原型特征',
        战术含义: '针对该原型采取专门策略'
      };
    }

    // 构建触发条件说明
    for (var field in archetypeData.conditions) {
      var condition = archetypeData.conditions[field];
      var value = stats[field];
      if (field === '立直率' || field === '副露率' || field === '和牌率' || field === '放铳率') {
        value = (value * 100).toFixed(1) + '%';
      } else if (field === '默听率' || field === '被炸率') {
        value = (value * 100).toFixed(1) + '%';
      } else {
        value = value.toFixed(1);
      }
      if (condition.min !== undefined) {
        var threshold = condition.min;
        if (field === '立直率' || field === '副露率' || field === '和牌率' || field === '放铳率') {
          threshold = threshold + '%';
        } else if (field === '默听率' || field === '被炸率') {
          threshold = (threshold * 100).toFixed(1) + '%';
        }
        conditions.push(field + ' ' + value + ' ≥ ' + threshold);
      }
      if (condition.max !== undefined) {
        var threshold = condition.max;
        if (field === '立直率' || field === '副露率' || field === '和牌率' || field === '放铳率') {
          threshold = threshold + '%';
        } else if (field === '默听率' || field === '被炸率') {
          threshold = (threshold * 100).toFixed(1) + '%';
        }
        conditions.push(field + ' ' + value + ' ≤ ' + threshold);
      }
    }
    return {
      触发条件: '匹配玩家原型: ' + archetype.name + '（' + conditions.join('，') + '）',
      数据支撑: '基于玩家的行为模式和统计数据综合判断',
      推理逻辑: '玩家的多项关键指标符合该原型的典型特征，说明其打法风格明确',
      战术含义: '针对该原型的特点采取专门的对抗策略，可以更有效地应对'
    };
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

  // 创建玩家风格信息UI（增强版 - 包含建议解释）
  function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf, archetype, advice) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) {
      existingUI.remove();
    }
    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = 'position: fixed; background: rgba(0,0,0,0.85); color: #fff; padding: 10px 14px; border-radius: 10px; font-size: 11px; z-index: 10000; box-shadow: 0 0 15px rgba(0,0,0,0.7); pointer-events: auto; width: 320px; max-height: 80vh; overflow-y: auto;';

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

    // 构建标题行（包含原型信息和危险度）
    var titleText = 主称号;
    if (archetype) {
      titleText = archetype.icon + ' ' + archetype.name;
    }
    var 标签文本 = 标签.length > 0 ? '<br><span style="color: #ffa500; font-size: 9px;">' + 标签.slice(0, 3).map(escapeHtml).join(' | ') + '</span>' : '';
    var 玩家名 = '<span style="color: #aaa; font-size: 9px; margin-left: 5px;">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';
    var html = '<div style="font-weight: bold; font-size: 13px; color: #ffd700; margin-bottom: 6px;">【' + escapeHtml(titleText) + '】' + 玩家名 + 标签文本 + '</div>';

    // 危险度评分（如果有）
    if (advice && advice.危险度) {
      var dangerLevel = advice.危险度;
      html += '<div style="background: rgba(255,0,0,0.15); padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid ' + getDangerColor(dangerLevel.分数) + ';">';
      html += '<div style="font-size: 11px; font-weight: bold; color: ' + getDangerColor(dangerLevel.分数) + ';">' + dangerLevel.图标 + ' 危险度: ' + dangerLevel.分数 + '/10 - ' + escapeHtml(dangerLevel.标签) + '</div>';
      html += '<div style="font-size: 9px; color: #bbb; margin-top: 2px;">置信度: ' + escapeHtml(dangerLevel.置信度) + '</div>';
      html += '</div>';
    }

    // 基础数据
    html += '<div style="line-height: 1.6; font-size: 10px; margin-bottom: 8px;">';
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

    // 策略建议（增强版 - 包含解释）
    if (advice && advice.策略建议 && advice.策略建议.length > 0) {
      html += '<div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 8px; margin-top: 8px;">';
      html += '<div style="font-weight: bold; font-size: 11px; color: #4fc3f7; margin-bottom: 6px;">策略建议:</div>';
      for (var i = 0; i < Math.min(advice.策略建议.length, 5); i++) {
        var strategy = advice.策略建议[i];

        // 如果是旧格式（字符串），直接显示
        if (typeof strategy === 'string') {
          html += '<div style="margin-bottom: 6px; padding: 6px 8px; background: rgba(79,195,247,0.1); border-radius: 6px; font-size: 10px;">';
          html += '<div style="color: #fff;">• ' + escapeHtml(strategy) + '</div>';
          html += '</div>';
          continue;
        }

        // 新格式（结构化建议）
        var priorityColor = getPriorityColor(strategy.优先级);
        var priorityLabel = getPriorityLabel(strategy.优先级);
        html += '<div style="margin-bottom: 8px; padding: 8px 10px; background: rgba(79,195,247,0.1); border-radius: 6px; border-left: 3px solid ' + priorityColor + ';">';

        // 建议标题
        html += '<div style="font-size: 10px; color: #fff; font-weight: bold; margin-bottom: 4px;">';
        html += '<span style="color: ' + priorityColor + ';">[' + priorityLabel + ']</span> ' + escapeHtml(strategy.建议);
        html += '</div>';

        // 置信度和来源
        html += '<div style="font-size: 8px; color: #999; margin-bottom: 4px;">';
        html += '置信度: ' + escapeHtml(strategy.置信度) + ' | 来源: ' + escapeHtml(strategy.来源);
        html += '</div>';

        // 详细理由（可折叠）
        if (strategy.理由) {
          var detailId = 'detail-' + index + '-' + i;
          html += '<div style="font-size: 9px; color: #bbb; margin-top: 4px; cursor: pointer;" onclick="toggleDetail(\'' + detailId + '\')">';
          html += '▶ 点击查看详细分析';
          html += '</div>';
          html += '<div id="' + detailId + '" style="display: none; font-size: 8px; color: #aaa; margin-top: 6px; padding: 6px; background: rgba(0,0,0,0.3); border-radius: 4px; line-height: 1.5;">';
          if (strategy.理由.触发条件) {
            html += '<div style="margin-bottom: 3px;"><span style="color: #4fc3f7;">触发条件:</span> ' + escapeHtml(strategy.理由.触发条件) + '</div>';
          }
          if (strategy.理由.数据支撑) {
            html += '<div style="margin-bottom: 3px;"><span style="color: #4fc3f7;">数据支撑:</span> ' + escapeHtml(strategy.理由.数据支撑) + '</div>';
          }
          if (strategy.理由.推理逻辑) {
            html += '<div style="margin-bottom: 3px;"><span style="color: #4fc3f7;">推理逻辑:</span> ' + escapeHtml(strategy.理由.推理逻辑) + '</div>';
          }
          if (strategy.理由.战术含义) {
            html += '<div><span style="color: #4fc3f7;">战术含义:</span> ' + escapeHtml(strategy.理由.战术含义) + '</div>';
          }
          html += '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    container.innerHTML = html;
    document.body.appendChild(container);

    // 添加折叠/展开功能
    if (!window.toggleDetail) {
      window.toggleDetail = function (id) {
        var element = document.getElementById(id);
        if (element) {
          if (element.style.display === 'none') {
            element.style.display = 'block';
            element.previousElementSibling.innerHTML = '▼ 点击隐藏详细分析';
          } else {
            element.style.display = 'none';
            element.previousElementSibling.innerHTML = '▶ 点击查看详细分析';
          }
        }
      };
    }
  }

  // 获取危险度颜色
  function getDangerColor(score) {
    if (score >= 9) return '#ff1744';
    if (score >= 7) return '#ff9800';
    if (score >= 5) return '#ffc107';
    if (score >= 3) return '#8bc34a';
    return '#4caf50';
  }

  // 获取优先级颜色
  function getPriorityColor(priority) {
    if (priority >= 8) return '#ff1744';
    if (priority >= 6) return '#ff9800';
    if (priority >= 4) return '#ffc107';
    if (priority >= 2) return '#8bc34a';
    return '#4caf50';
  }

  // 获取优先级标签
  function getPriorityLabel(priority) {
    if (priority >= 8) return '高优先级';
    if (priority >= 5) return '中优先级';
    return '低优先级';
  }

  // 控制台输出详细分析
  function printAnalysis(playerData, analysis, baseline, index, isSelf, stats) {
    var 主称号 = analysis.主称号;
    var 标签 = analysis.标签;
    var 数据 = analysis.数据;
    var 偏差 = analysis.偏差;
    var advice = generateAdvice(analysis, stats);

    // 传递完整的 advice 对象到 UI
    createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, playerData.nickname, isSelf, advice.原型, advice);
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
    console.log('    危险度: ' + advice.危险度.图标 + ' ' + advice.危险度.分数 + '/10 - ' + advice.危险度.标签 + ' (置信度: ' + advice.危险度.置信度 + ')');
    if (advice.原型) {
      console.log('    玩家原型: ' + advice.原型.icon + ' ' + advice.原型.name + ' (匹配度: ' + advice.原型.score.toFixed(1) + ')');
    }
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
      if (typeof tip === 'string') {
        console.log('      ' + (index + 1) + '. ' + tip);
      } else {
        console.log('      ' + (index + 1) + '. [' + tip.来源 + '] ' + tip.建议);
        console.log('         置信度: ' + tip.置信度 + ' | 优先级: ' + tip.优先级);
        if (tip.理由 && tip.理由.触发条件) {
          console.log('         触发条件: ' + tip.理由.触发条件);
        }
      }
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
