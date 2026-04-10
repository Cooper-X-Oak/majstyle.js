// ==UserScript==
// @name         雀魂四麻风格分析助手
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  四人麻将对手风格实时分析（支持所有段位）- v2.2.1 算法修复
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// ==/UserScript==

/* eslint-disable */

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

  // 深度探索对象（递归）
  function deepExplore(obj, path, maxDepth, currentDepth) {

    if (currentDepth >= maxDepth || !obj || _typeof(obj) !== 'object') {
      return;
    }
    var keys = Object.keys(obj);
    var statsKeywords = ['stat', 'rate', '率', '点', 'count', 'avg', 'average', 'total', 'score', 'data', 'record', 'history'];
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = obj[key];
      var fullPath = path + '.' + key;

      // 检查是否包含统计关键词
      var hasStatsKeyword = false;
      for (var j = 0; j < statsKeywords.length; j++) {
        if (key.toLowerCase().indexOf(statsKeywords[j]) !== -1) {
          hasStatsKeyword = true;
          break;
        }
      }
      if (hasStatsKeyword) {
        console.log('🔍 发现可能的统计数据: ' + fullPath);
        console.log('   类型:', _typeof(value));
        if (Array.isArray(value)) {
          console.log('   数组长度:', value.length);
          if (value.length > 0) {
            console.log('   第一个元素:', JSON.stringify(value[0]).substring(0, 200));
          }
        } else if (_typeof(value) === 'object' && value !== null) {
          console.log('   对象属性:', Object.keys(value).slice(0, 10).join(', '));
        } else {
          console.log('   值:', value);
        }
        console.log('');
      }

      // 递归探索
      if (_typeof(value) === 'object' && value !== null && !Array.isArray(value)) {
        deepExplore(value, fullPath, maxDepth, currentDepth + 1);
      }
    }
  }

  // 探索游戏对象结构（增强版）
  function exploreGameObject() {

    var gameWindow = getGameWindow();
    console.log('=== 雀魂游戏对象结构深度探索 ===');
    console.log('目标: 寻找玩家统计数据（立直率、和牌率等 51 个字段）');
    console.log('');

    // 探索 view 对象
    if (gameWindow.view) {
      console.log('【1. view 对象】');
      console.log('可用属性:', Object.keys(gameWindow.view));
      console.log('');

      // 探索 DesktopMgr
      if (gameWindow.view.DesktopMgr && gameWindow.view.DesktopMgr.Inst) {
        console.log('【2. view.DesktopMgr.Inst 对象】');
        var instKeys = Object.keys(gameWindow.view.DesktopMgr.Inst);
        console.log('可用属性 (' + instKeys.length + ' 个):', instKeys);
        console.log('');

        // 探索 player_datas
        if (gameWindow.view.DesktopMgr.Inst.player_datas) {
          console.log('【3. player_datas 数组】');
          var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
          console.log('玩家数量:', playerDatas.length);
          if (playerDatas.length > 0) {
            console.log('第一个玩家对象的所有属性:');
            console.log(Object.keys(playerDatas[0]));
            console.log('');
            console.log('第一个玩家完整数据:');
            console.log(JSON.stringify(playerDatas[0], null, 2));
            console.log('');

            // 深度探索玩家对象
            console.log('【4. 深度探索玩家对象（寻找统计数据）】');
            deepExplore(playerDatas[0], 'player_datas[0]', 5, 0);
          }
        }

        // 深度探索 DesktopMgr.Inst
        console.log('【5. 深度探索 DesktopMgr.Inst（寻找统计数据）】');
        deepExplore(gameWindow.view.DesktopMgr.Inst, 'view.DesktopMgr.Inst', 3, 0);
      }
    }

    // 探索 GameMgr 对象
    if (gameWindow.GameMgr && gameWindow.GameMgr.Inst) {
      console.log('【6. GameMgr.Inst 对象】');
      var gameMgrKeys = Object.keys(gameWindow.GameMgr.Inst);
      console.log('可用属性 (' + gameMgrKeys.length + ' 个):', gameMgrKeys);
      console.log('');

      // 深度探索 GameMgr.Inst
      console.log('【7. 深度探索 GameMgr.Inst（寻找统计数据）】');
      deepExplore(gameWindow.GameMgr.Inst, 'GameMgr.Inst', 3, 0);
    }

    // 探索顶层 window 对象
    console.log('【8. 探索顶层 window 对象（寻找统计相关对象）】');
    var topLevelKeys = Object.keys(gameWindow);
    var statsRelatedKeys = topLevelKeys.filter(function (key) {
      return key.toLowerCase().indexOf('stat') !== -1 || key.toLowerCase().indexOf('player') !== -1 || key.toLowerCase().indexOf('data') !== -1 || key.toLowerCase().indexOf('record') !== -1;
    });
    if (statsRelatedKeys.length > 0) {
      console.log('发现可能相关的顶层对象:', statsRelatedKeys);
      statsRelatedKeys.forEach(function (key) {
        console.log('');
        console.log('探索 window.' + key + ':');
        if (gameWindow[key] && _typeof(gameWindow[key]) === 'object') {
          console.log('  属性:', Object.keys(gameWindow[key]).slice(0, 20));
          deepExplore(gameWindow[key], 'window.' + key, 3, 0);
        }
      });
    } else {
      console.log('未发现明显的统计相关顶层对象');
    }
    console.log('');
    console.log('=== 探索完成 ===');
    console.log('');
    console.log('📋 下一步操作:');
    console.log('1. 查看上面标记为 🔍 的路径');
    console.log('2. 在控制台手动访问这些路径，查看完整数据');
    console.log('3. 将包含 51 个统计字段的路径告诉开发者');
    console.log('');
    console.log('💡 提示: 寻找包含以下字段的对象:');
    console.log('   立直率、副露率、和牌率、放铳率、平均打点、立直收支、');
    console.log('   立直后和牌率、副露后和牌率、和了巡数、被炸率、默听率等');
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

  var version = "2.2.0";
  var description = "雀魂金玉四麻风格分析配置文件";
  var dimensions = {
  	riichi_tendency: {
  		name: "立直倾向",
  		fields: [
  			"立直率",
  			"立直收支",
  			"立直后和牌率"
  		],
  		thresholds: {
  			crazy: {
  				"立直率": 25,
  				"立直收支": 1500
  			},
  			normal: {
  				"立直率": 18
  			},
  			conservative: {
  				"立直率": 12
  			}
  		},
  		labels: {
  			crazy: "立直狂",
  			normal: "立直型",
  			conservative: "立直保守"
  		}
  	},
  	fulu_tendency: {
  		name: "副露倾向",
  		fields: [
  			"副露率",
  			"副露后和牌率",
  			"副露巡目"
  		],
  		thresholds: {
  			aggressive: {
  				"副露率": 38,
  				"副露后和牌率": 0.3
  			},
  			normal: {
  				"副露率": 32
  			},
  			conservative: {
  				"副露率": 28
  			}
  		},
  		labels: {
  			aggressive: "速攻流",
  			normal: "副露型",
  			conservative: "副露保守"
  		}
  	},
  	defense_tendency: {
  		name: "防守倾向",
  		fields: [
  			"放铳率",
  			"平均铳点",
  			"被炸率"
  		],
  		thresholds: {
  			fortress: {
  				"放铳率": 13,
  				"平均铳点": 5000
  			},
  			normal: {
  				"放铳率": 15
  			},
  			weak: {
  				"放铳率": 17
  			}
  		},
  		labels: {
  			fortress: "铁壁",
  			normal: "防守正常",
  			weak: "漏勺"
  		}
  	},
  	speed_tendency: {
  		name: "速度倾向",
  		fields: [
  			"和了巡数",
  			"副露巡目",
  			"立直巡目"
  		],
  		thresholds: {
  			fast: {
  				"和了巡数": 11
  			},
  			normal: {
  				"和了巡数": 12
  			},
  			slow: {
  				"和了巡数": 13
  			}
  		},
  		labels: {
  			fast: "速攻型",
  			normal: "中速型",
  			slow: "慢速型"
  		}
  	},
  	daten_tendency: {
  		name: "打点倾向",
  		fields: [
  			"平均打点",
  			"被炸率"
  		],
  		thresholds: {
  			high: {
  				"平均打点": 7000
  			},
  			normal: {
  				"平均打点": 6500
  			},
  			low: {
  				"平均打点": 6000
  			}
  		},
  		labels: {
  			high: "大牌猎人",
  			normal: "打点均衡",
  			low: "速和型"
  		}
  	}
  };
  var archetypes = {
  	RIICHI_SPECIALIST: {
  		name: "立直专家",
  		icon: "🎯",
  		conditions: [
  			{
  				field: "立直率",
  				operator: ">=",
  				value: 25
  			},
  			{
  				field: "立直收支",
  				operator: ">=",
  				value: 1500
  			},
  			{
  				field: "副露率",
  				operator: "<=",
  				value: 30
  			}
  		],
  		advice: [
  			"对手立直质量高，立直后建议立即弃牌",
  			"警惕对手的好型立直，避免放铳大牌",
  			"对手不擅长副露，可以通过鸣牌抢先"
  		]
  	},
  	FULU_SPECIALIST: {
  		name: "副露专家",
  		icon: "⚡",
  		conditions: [
  			{
  				field: "副露率",
  				operator: ">=",
  				value: 38
  			},
  			{
  				field: "副露后和牌率",
  				operator: ">=",
  				value: 0.3
  			},
  			{
  				field: "立直率",
  				operator: "<=",
  				value: 20
  			}
  		],
  		advice: [
  			"对手副露效率高，副露后威胁大",
  			"注意对手的速攻倾向，需要抢先进攻",
  			"对手立直较少，可以通过立直施压"
  		]
  	},
  	SILENT_HUNTER: {
  		name: "默听猎手",
  		icon: "🥷",
  		conditions: [
  			{
  				field: "默听率",
  				operator: ">=",
  				value: 0.15
  			},
  			{
  				field: "立直率",
  				operator: "<=",
  				value: 20
  			},
  			{
  				field: "放铳率",
  				operator: "<=",
  				value: 14
  			}
  		],
  		advice: [
  			"对手有高默听倾向，警惕无征兆进攻",
  			"对手防守能力强，需要更高牌型质量",
  			"难以通过立直/副露判断对手听牌状态"
  		]
  	},
  	SPEED_DEMON: {
  		name: "速攻型",
  		icon: "💨",
  		conditions: [
  			{
  				field: "和了巡数",
  				operator: "<=",
  				value: 11
  			},
  			{
  				field: "副露率",
  				operator: ">=",
  				value: 35
  			},
  			{
  				field: "和牌率",
  				operator: ">=",
  				value: 21
  			}
  		],
  		advice: [
  			"对手速度极快，需要抢先进攻",
  			"对手倾向速和小牌，可以做大牌反制",
  			"警惕对手的快速副露进攻"
  		]
  	},
  	VALUE_MAXIMIZER: {
  		name: "价值型",
  		icon: "💎",
  		conditions: [
  			{
  				field: "平均打点",
  				operator: ">=",
  				value: 7000
  			},
  			{
  				field: "立直率",
  				operator: ">=",
  				value: 20
  			},
  			{
  				field: "和了巡数",
  				operator: ">=",
  				value: 12
  			}
  		],
  		advice: [
  			"对手倾向做大牌，防守时要特别小心",
  			"对手速度较慢，有时间布局和抢先",
  			"对手立直质量高，立直后建议弃牌"
  		]
  	},
  	DEFENSIVE_FORTRESS: {
  		name: "防守型",
  		icon: "🛡️",
  		conditions: [
  			{
  				field: "放铳率",
  				operator: "<=",
  				value: 13
  			},
  			{
  				field: "被炸率",
  				operator: "<=",
  				value: 0.08
  			},
  			{
  				field: "默听率",
  				operator: ">=",
  				value: 0.12
  			}
  		],
  		advice: [
  			"对手防守能力极强，难以放铳",
  			"对手倾向默听，进攻意图不明显",
  			"需要更高的牌型质量才能有效施压"
  		]
  	}
  };
  var danger_weights = {
  	"净打点效率": 0.3,
  	"默听率": 0.15,
  	"立直收支": 0.2,
  	"平均铳点": 0.05,
  	"被炸率": 0.1,
  	"和了巡数": 0.1,
  	"立直后和牌率": 0.05,
  	"副露后和牌率": 0.03,
  	"和牌率": 0.02
  };
  var danger_normalization = {
  	"净打点效率": {
  		min: -1e3,
  		max: 2000,
  		inverted: false
  	},
  	"默听率": {
  		min: 0,
  		max: 0.2,
  		inverted: false
  	},
  	"立直收支": {
  		min: -1e3,
  		max: 3000,
  		inverted: false
  	},
  	"平均铳点": {
  		min: 4000,
  		max: 6000,
  		inverted: true
  	},
  	"被炸率": {
  		min: 0,
  		max: 0.1,
  		inverted: true
  	},
  	"和了巡数": {
  		min: 9,
  		max: 14,
  		inverted: true
  	},
  	"立直后和牌率": {
  		min: 0,
  		max: 0.5,
  		inverted: false
  	},
  	"副露后和牌率": {
  		min: 0,
  		max: 0.4,
  		inverted: false
  	},
  	"和牌率": {
  		min: 0.18,
  		max: 0.26,
  		inverted: false
  	}
  };
  var style_thresholds = {
  	"进攻意愿": {
  		"高": 1.5,
  		"低": -1.5
  	},
  	"进攻效率": {
  		"高": 2,
  		"低": -2
  	},
  	"放铳率": {
  		"铁壁": -2,
  		"漏勺": 2
  	},
  	"平均打点": {
  		"大牌": 500,
  		"速和": -500
  	},
  	"追立率": {
  		"狂魔": 25,
  		"保守": 15
  	},
  	"先制率": {
  		"先制王": 85,
  		"追立型": 75
  	},
  	"立直好型": {
  		"好型": 60,
  		"赌博": 40
  	}
  };
  var strength_levels = {
  	attack: [
  		{
  			level: 10,
  			label: "Lv.10 传说",
  			threshold: 95,
  			color: "#FFD700"
  		},
  		{
  			level: 9,
  			label: "Lv.9 王者",
  			threshold: 85,
  			color: "#FFD700"
  		},
  		{
  			level: 8,
  			label: "Lv.8 大师",
  			threshold: 75,
  			color: "#9B59B6"
  		},
  		{
  			level: 7,
  			label: "Lv.7 专家",
  			threshold: 65,
  			color: "#9B59B6"
  		},
  		{
  			level: 6,
  			label: "Lv.6 精英",
  			threshold: 55,
  			color: "#3498DB"
  		},
  		{
  			level: 5,
  			label: "Lv.5 熟练",
  			threshold: 45,
  			color: "#3498DB"
  		},
  		{
  			level: 4,
  			label: "Lv.4 进阶",
  			threshold: 35,
  			color: "#95A5A6"
  		},
  		{
  			level: 3,
  			label: "Lv.3 入门",
  			threshold: 25,
  			color: "#95A5A6"
  		},
  		{
  			level: 2,
  			label: "Lv.2 新手",
  			threshold: 15,
  			color: "#95A5A6"
  		},
  		{
  			level: 1,
  			label: "Lv.1 初学",
  			threshold: 0,
  			color: "#95A5A6"
  		}
  	],
  	defense: [
  		{
  			level: 10,
  			label: "Lv.10 传说",
  			threshold: 95,
  			color: "#FFD700"
  		},
  		{
  			level: 9,
  			label: "Lv.9 王者",
  			threshold: 85,
  			color: "#FFD700"
  		},
  		{
  			level: 8,
  			label: "Lv.8 大师",
  			threshold: 75,
  			color: "#9B59B6"
  		},
  		{
  			level: 7,
  			label: "Lv.7 专家",
  			threshold: 65,
  			color: "#9B59B6"
  		},
  		{
  			level: 6,
  			label: "Lv.6 精英",
  			threshold: 55,
  			color: "#3498DB"
  		},
  		{
  			level: 5,
  			label: "Lv.5 熟练",
  			threshold: 45,
  			color: "#3498DB"
  		},
  		{
  			level: 4,
  			label: "Lv.4 进阶",
  			threshold: 35,
  			color: "#95A5A6"
  		},
  		{
  			level: 3,
  			label: "Lv.3 入门",
  			threshold: 25,
  			color: "#95A5A6"
  		},
  		{
  			level: 2,
  			label: "Lv.2 新手",
  			threshold: 15,
  			color: "#95A5A6"
  		},
  		{
  			level: 1,
  			label: "Lv.1 初学",
  			threshold: 0,
  			color: "#95A5A6"
  		}
  	]
  };
  var confidence_thresholds = {
  	high: 400,
  	medium: 200,
  	low: 100,
  	very_low: 50
  };
  var level_baseline = {
  	"10301": {
  		name: "士3",
  		"立直率": 19.66,
  		"副露率": 35.83,
  		"和牌率": 21.08,
  		"放铳率": 17.55,
  		"平均打点": 6688
  	},
  	"10401": {
  		name: "杰1",
  		"立直率": 19.81,
  		"副露率": 35.44,
  		"和牌率": 21.55,
  		"放铳率": 16.81,
  		"平均打点": 6639
  	},
  	"10402": {
  		name: "杰2",
  		"立直率": 19.9,
  		"副露率": 34.8,
  		"和牌率": 22.22,
  		"放铳率": 15.92,
  		"平均打点": 6663
  	},
  	"10403": {
  		name: "杰3",
  		"立直率": 19.58,
  		"副露率": 33.74,
  		"和牌率": 22.25,
  		"放铳率": 15.08,
  		"平均打点": 6651
  	},
  	"10501": {
  		name: "豪1",
  		"立直率": 19.35,
  		"副露率": 32.51,
  		"和牌率": 22.2,
  		"放铳率": 14.12,
  		"平均打点": 6634
  	},
  	"10502": {
  		name: "豪2",
  		"立直率": 19.02,
  		"副露率": 32.06,
  		"和牌率": 22.04,
  		"放铳率": 13.49,
  		"平均打点": 6597
  	},
  	"10503": {
  		name: "豪3",
  		"立直率": 18.77,
  		"副露率": 32.03,
  		"和牌率": 22.14,
  		"放铳率": 12.93,
  		"平均打点": 6571
  	},
  	"10601": {
  		name: "圣1",
  		"立直率": 18.54,
  		"副露率": 32.04,
  		"和牌率": 22.14,
  		"放铳率": 12.45,
  		"平均打点": 6538
  	},
  	"10602": {
  		name: "圣2",
  		"立直率": 18.47,
  		"副露率": 32.03,
  		"和牌率": 22.12,
  		"放铳率": 12.14,
  		"平均打点": 6520
  	},
  	"10603": {
  		name: "圣3",
  		"立直率": 18.38,
  		"副露率": 32.36,
  		"和牌率": 22.37,
  		"放铳率": 11.73,
  		"平均打点": 6485
  	},
  	"10701": {
  		name: "魂1",
  		"立直率": 18.25,
  		"副露率": 32.68,
  		"和牌率": 22.56,
  		"放铳率": 11.41,
  		"平均打点": 6472
  	}
  };
  var default_baseline_level = "10403";
  var strength_calculation = {
  	attack: {
  		weights: {
  			"立直进攻": 0.3,
  			"副露进攻": 0.25,
  			"速度": 0.25,
  			"打点": 0.2
  		},
  		normalization: {
  			"立直率": {
  				min: 10,
  				max: 30
  			},
  			"立直收支": {
  				min: -1e3,
  				max: 3000
  			},
  			"立直后和牌率": {
  				min: 30,
  				max: 55
  			},
  			"副露率": {
  				min: 20,
  				max: 45
  			},
  			"副露后和牌率": {
  				min: 20,
  				max: 40
  			},
  			"和了巡数": {
  				min: 14,
  				max: 9
  			},
  			"平均打点": {
  				min: 5500,
  				max: 7500
  			},
  			"自摸率": {
  				min: 5,
  				max: 15
  			}
  		},
  		sub_weights: {
  			"立直进攻": {
  				"立直率": 0.4,
  				"立直收支": 0.4,
  				"立直后和牌率": 0.2
  			},
  			"副露进攻": {
  				"副露率": 0.5,
  				"副露后和牌率": 0.5
  			},
  			"打点": {
  				"平均打点": 0.7,
  				"自摸率": 0.3
  			}
  		},
  		attitude_thresholds: {
  			"立直狂": {
  				"立直率": 25,
  				"立直进攻": 7
  			},
  			"立直型": {
  				"立直率": 20,
  				"立直进攻": 5
  			},
  			"副露狂": {
  				"副露率": 38,
  				"副露进攻": 7
  			},
  			"副露型": {
  				"副露率": 35,
  				"副露进攻": 5
  			},
  			"速攻狂": {
  				"和了巡数": 11,
  				"速度": 7
  			},
  			"速攻型": {
  				"和了巡数": 12,
  				"速度": 5
  			},
  			"大牌型": {
  				"打点": 7
  			}
  		}
  	},
  	defense: {
  		weights: {
  			"放铳控制": 0.4,
  			"大牌防守": 0.3,
  			"隐蔽性": 0.2,
  			"立直防守": 0.1
  		},
  		normalization: {
  			"放铳率": {
  				min: 18,
  				max: 11
  			},
  			"平均铳点": {
  				min: 5500,
  				max: 4500
  			},
  			"被炸率": {
  				min: 12,
  				max: 5
  			},
  			"默听率": {
  				min: 5,
  				max: 20
  			},
  			"立直后放铳率": {
  				min: 15,
  				max: 5
  			}
  		},
  		sub_weights: {
  			"放铳控制": {
  				"放铳率": 0.7,
  				"平均铳点": 0.3
  			}
  		},
  		attitude_thresholds: {
  			"铁壁": {
  				"放铳率": 13,
  				"放铳控制": 7
  			},
  			"防守稳健": {
  				"放铳率": 15,
  				"放铳控制": 5
  			},
  			"防守弱": {
  				"放铳率": 17
  			},
  			"隐蔽高手": {
  				"默听率": 15,
  				"隐蔽性": 7
  			},
  			"大牌防守差": {
  				"被炸率": 10,
  				"大牌防守": 4
  			}
  		}
  	}
  };
  var analysisConfig = {
  	version: version,
  	description: description,
  	dimensions: dimensions,
  	archetypes: archetypes,
  	danger_weights: danger_weights,
  	danger_normalization: danger_normalization,
  	style_thresholds: style_thresholds,
  	strength_levels: strength_levels,
  	confidence_thresholds: confidence_thresholds,
  	level_baseline: level_baseline,
  	default_baseline_level: default_baseline_level,
  	strength_calculation: strength_calculation
  };

  // 配置缓存
  var configCache = null;

  // 加载配置
  function loadConfig() {

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

    if (!customConfig) {
      return JSON.parse(JSON.stringify(defaultConfig));
    }
    var merged = JSON.parse(JSON.stringify(defaultConfig));

    // 深度合并
    for (var key in customConfig) {
      if (customConfig.hasOwnProperty(key)) {
        if (_typeof(customConfig[key]) === 'object' && !Array.isArray(customConfig[key])) {
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

    var requiredFields = ['version', 'dimensions', 'archetypes', 'danger_weights', 'style_thresholds'];
    for (var i = 0; i < requiredFields.length; i++) {
      if (!config[requiredFields[i]]) {
        throw new Error('[配置加载器] 配置缺少必需字段: ' + requiredFields[i]);
      }
    }
    console.log('[配置加载器] 配置验证通过，版本:', config.version);
  }

  // 获取配置项
  function getConfigValue(path) {

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

  // 获取危险度权重
  function getDangerWeights() {

    return getConfigValue('danger_weights');
  }

  // 获取危险度归一化范围
  function getDangerNormalization() {

    return getConfigValue('danger_normalization');
  }

  // 获取风格阈值
  function getStyleThresholds() {

    return getConfigValue('style_thresholds');
  }

  // API 配置（待移除）
  var API_CONFIG = {
    baseUrl: 'https://5-data.amae-koromo.com/api/v2/pl4',
    startTime: 1262304000000,
    params: {
      mode: '12.9',
      tag: '492541'
    }
  };

  // 获取段位基准数据
  function getBaseline(levelId) {

    var config = loadConfig();
    var baseline = config.level_baseline[String(levelId)];
    if (baseline) {
      return baseline;
    }

    // 返回默认基准
    var defaultLevelId = config.default_baseline_level;
    return config.level_baseline[defaultLevelId];
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
    var 进攻效率 = 进攻意愿 > 0 ? 和牌率 / 进攻意愿 * 100 : 0;
    var 基准进攻效率 = 基准进攻意愿 > 0 ? baseline.和牌率 / 基准进攻意愿 * 100 : 0;
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

    // 从配置加载原型定义
    var config = loadConfig();
    var ARCHETYPES = config.archetypes;
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

  // 计算原型匹配度（支持新的条件格式）
  function calculateArchetypeMatch(stats, conditions) {

    var totalConditions = conditions.length;
    var metConditions = 0;
    var overallScore = 0;
    for (var i = 0; i < conditions.length; i++) {
      var condition = conditions[i];
      var field = condition.field;
      var operator = condition.operator;
      var threshold = condition.value;
      var value = stats[field];

      // 处理百分比字段（需要转换）
      if (field === '立直率' || field === '副露率' || field === '放铳率' || field === '和牌率') {
        value = value * 100;
      }
      var met = false;
      var deviation = 0;

      // 根据操作符检查条件
      if (operator === '>=') {
        if (value >= threshold) {
          met = true;
          deviation = (value - threshold) / threshold;
        } else {
          deviation = (threshold - value) / threshold;
        }
      } else if (operator === '<=') {
        if (value <= threshold) {
          met = true;
          deviation = (threshold - value) / threshold;
        } else {
          deviation = (value - threshold) / threshold;
        }
      } else if (operator === '>') {
        if (value > threshold) {
          met = true;
          deviation = (value - threshold) / threshold;
        } else {
          deviation = (threshold - value) / threshold;
        }
      } else if (operator === '<') {
        if (value < threshold) {
          met = true;
          deviation = (threshold - value) / threshold;
        } else {
          deviation = (value - threshold) / threshold;
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

    // 必须满足所有条件才算匹配
    if (metConditions < totalConditions) {
      return 0;
    }
    return overallScore;
  }

  // 获取原型的战术建议
  function getArchetypeAdvice(archetypeKey) {

    // 从配置加载原型建议
    var config = loadConfig();
    var archetype = config.archetypes[archetypeKey];
    if (archetype && archetype.advice) {
      return archetype.advice;
    }
    return [];
  }

  // 强度评估模块
  // 负责计算进攻强度和防守强度，生成态度词和等级


  // 评估进攻强度
  function evaluateAttackStrength(stats) {

    var config = loadConfig();
    var attackConfig = config.strength_calculation.attack;
    var scores = {};
    var totalWeight = 0;
    var weightedSum = 0;

    // 1. 立直进攻
    var riichiScore = calculateRiichiAttack(stats, attackConfig);
    scores.立直进攻 = riichiScore;
    weightedSum += riichiScore * attackConfig.weights.立直进攻;
    totalWeight += attackConfig.weights.立直进攻;

    // 2. 副露进攻
    var fuluScore = calculateFuluAttack(stats, attackConfig);
    scores.副露进攻 = fuluScore;
    weightedSum += fuluScore * attackConfig.weights.副露进攻;
    totalWeight += attackConfig.weights.副露进攻;

    // 3. 速度
    var speedScore = calculateSpeed(stats, attackConfig);
    scores.速度 = speedScore;
    weightedSum += speedScore * attackConfig.weights.速度;
    totalWeight += attackConfig.weights.速度;

    // 4. 打点
    var datenScore = calculateDaten(stats, attackConfig);
    scores.打点 = datenScore;
    weightedSum += datenScore * attackConfig.weights.打点;
    totalWeight += attackConfig.weights.打点;

    // 计算总分 (0-100)
    var totalScore = weightedSum / totalWeight * 10;

    // 生成态度词
    var attitude = generateAttackAttitude(stats, scores, attackConfig);

    // 获取等级
    var level = getStrengthLevel(totalScore, 'attack');
    return {
      总分: totalScore,
      等级: level.level,
      标签: level.label,
      颜色: level.color,
      态度词: attitude,
      子维度: scores
    };
  }

  // 评估防守强度
  function evaluateDefenseStrength(stats) {

    var config = loadConfig();
    var defenseConfig = config.strength_calculation.defense;
    var scores = {};
    var totalWeight = 0;
    var weightedSum = 0;

    // 1. 放铳控制
    var dealScore = calculateDealControl(stats, defenseConfig);
    scores.放铳控制 = dealScore;
    weightedSum += dealScore * defenseConfig.weights.放铳控制;
    totalWeight += defenseConfig.weights.放铳控制;

    // 2. 大牌防守
    var bombScore = calculateBombDefense(stats, defenseConfig);
    scores.大牌防守 = bombScore;
    weightedSum += bombScore * defenseConfig.weights.大牌防守;
    totalWeight += defenseConfig.weights.大牌防守;

    // 3. 隐蔽性
    var concealScore = calculateConcealment(stats, defenseConfig);
    scores.隐蔽性 = concealScore;
    weightedSum += concealScore * defenseConfig.weights.隐蔽性;
    totalWeight += defenseConfig.weights.隐蔽性;

    // 4. 立直防守
    var riichiDefenseScore = calculateRiichiDefense(stats, defenseConfig);
    scores.立直防守 = riichiDefenseScore;
    weightedSum += riichiDefenseScore * defenseConfig.weights.立直防守;
    totalWeight += defenseConfig.weights.立直防守;

    // 计算总分 (0-100)
    var totalScore = weightedSum / totalWeight * 10;

    // 生成态度词
    var attitude = generateDefenseAttitude(stats, scores, defenseConfig);

    // 获取等级
    var level = getStrengthLevel(totalScore, 'defense');
    return {
      总分: totalScore,
      等级: level.level,
      标签: level.label,
      颜色: level.color,
      态度词: attitude,
      子维度: scores
    };
  }

  // ========== 进攻子维度计算 ==========

  // 立直进攻得分
  function calculateRiichiAttack(stats, config) {

    var norm = config.normalization;
    var subWeights = config.sub_weights.立直进攻;
    var riichiRate = (stats['立直率'] || 0) * 100;
    var riichiProfit = stats['立直收支'] || 0;
    var riichiWinRate = (stats['立直后和牌率'] || 0) * 100;

    // 立直率得分 (0-10)
    var rateScore = normalizeScore$1(riichiRate, norm.立直率.min, norm.立直率.max, 0, 10);

    // 立直收支得分 (0-10)
    var profitScore = normalizeScore$1(riichiProfit, norm.立直收支.min, norm.立直收支.max, 0, 10);

    // 立直后和牌率得分 (0-10)
    var winScore = normalizeScore$1(riichiWinRate, norm.立直后和牌率.min, norm.立直后和牌率.max, 0, 10);

    // 综合得分
    return rateScore * subWeights.立直率 + profitScore * subWeights.立直收支 + winScore * subWeights.立直后和牌率;
  }

  // 副露进攻得分
  function calculateFuluAttack(stats, config) {

    var norm = config.normalization;
    var subWeights = config.sub_weights.副露进攻;
    var fuluRate = (stats['副露率'] || 0) * 100;
    var fuluWinRate = (stats['副露后和牌率'] || 0) * 100;

    // 副露率得分 (0-10)
    var rateScore = normalizeScore$1(fuluRate, norm.副露率.min, norm.副露率.max, 0, 10);

    // 副露后和牌率得分 (0-10)
    var winScore = normalizeScore$1(fuluWinRate, norm.副露后和牌率.min, norm.副露后和牌率.max, 0, 10);

    // 综合得分
    return rateScore * subWeights.副露率 + winScore * subWeights.副露后和牌率;
  }

  // 速度得分
  function calculateSpeed(stats, config) {

    var norm = config.normalization;
    var avgTurn = stats['和了巡数'] || 12;

    // 和了巡数得分 (0-10)，巡数越小得分越高
    return normalizeScore$1(avgTurn, norm.和了巡数.min, norm.和了巡数.max, 0, 10);
  }

  // 打点得分
  function calculateDaten(stats, config) {

    var norm = config.normalization;
    var subWeights = config.sub_weights.打点;
    var avgDaten = stats['平均打点'] || 6500;
    var avgZimo = (stats['自摸率'] || 0) * 100;

    // 平均打点得分 (0-10)
    var datenScore = normalizeScore$1(avgDaten, norm.平均打点.min, norm.平均打点.max, 0, 10);

    // 自摸率得分 (0-10)
    var zimoScore = normalizeScore$1(avgZimo, norm.自摸率.min, norm.自摸率.max, 0, 10);

    // 综合得分
    return datenScore * subWeights.平均打点 + zimoScore * subWeights.自摸率;
  }

  // ========== 防守子维度计算 ==========

  // 放铳控制得分
  function calculateDealControl(stats, config) {

    var norm = config.normalization;
    var subWeights = config.sub_weights.放铳控制;
    var dealRate = (stats['放铳率'] || 0) * 100;
    var avgDealPoint = stats['平均铳点'] || 5000;

    // 放铳率得分 (0-10)，放铳率越低得分越高
    var rateScore = normalizeScore$1(dealRate, norm.放铳率.min, norm.放铳率.max, 0, 10);

    // 平均铳点得分 (0-10)，铳点越低得分越高
    var pointScore = normalizeScore$1(avgDealPoint, norm.平均铳点.min, norm.平均铳点.max, 0, 10);

    // 综合得分
    return rateScore * subWeights.放铳率 + pointScore * subWeights.平均铳点;
  }

  // 大牌防守得分
  function calculateBombDefense(stats, config) {

    var norm = config.normalization;
    var bombRate = (stats['被炸率'] || 0) * 100;

    // 被炸率得分 (0-10)，被炸率越低得分越高
    return normalizeScore$1(bombRate, norm.被炸率.min, norm.被炸率.max, 0, 10);
  }

  // 隐蔽性得分
  function calculateConcealment(stats, config) {

    var norm = config.normalization;
    var motenRate = (stats['默听率'] || 0) * 100;

    // 默听率得分 (0-10)
    return normalizeScore$1(motenRate, norm.默听率.min, norm.默听率.max, 0, 10);
  }

  // 立直防守得分
  function calculateRiichiDefense(stats, config) {

    var norm = config.normalization;
    var riichiDealRate = (stats['立直后放铳率'] || 0) * 100;

    // 立直后放铳率得分 (0-10)，放铳率越低得分越高
    return normalizeScore$1(riichiDealRate, norm.立直后放铳率.min, norm.立直后放铳率.max, 0, 10);
  }

  // ========== 态度词生成 ==========

  // 生成进攻态度词
  function generateAttackAttitude(stats, scores, config) {

    var attitudes = [];
    var thresholds = config.attitude_thresholds;
    var riichiRate = (stats['立直率'] || 0) * 100;
    var fuluRate = (stats['副露率'] || 0) * 100;
    var avgTurn = stats['和了巡数'] || 12;

    // 立直倾向
    if (riichiRate > thresholds.立直狂.立直率 && scores.立直进攻 > thresholds.立直狂.立直进攻) {
      attitudes.push('立直狂');
    } else if (riichiRate > thresholds.立直型.立直率 && scores.立直进攻 > thresholds.立直型.立直进攻) {
      attitudes.push('立直型');
    }

    // 副露倾向
    if (fuluRate > thresholds.副露狂.副露率 && scores.副露进攻 > thresholds.副露狂.副露进攻) {
      attitudes.push('副露狂');
    } else if (fuluRate > thresholds.副露型.副露率 && scores.副露进攻 > thresholds.副露型.副露进攻) {
      attitudes.push('副露型');
    }

    // 速度倾向
    if (avgTurn < thresholds.速攻狂.和了巡数 && scores.速度 > thresholds.速攻狂.速度) {
      attitudes.push('速攻狂');
    } else if (avgTurn < thresholds.速攻型.和了巡数 && scores.速度 > thresholds.速攻型.速度) {
      attitudes.push('速攻型');
    }

    // 打点倾向
    if (scores.打点 > thresholds.大牌型.打点) {
      attitudes.push('大牌型');
    }

    // 如果没有明显倾向
    if (attitudes.length === 0) {
      if (scores.立直进攻 > scores.副露进攻) {
        attitudes.push('立直型');
      } else {
        attitudes.push('副露型');
      }
    }
    return attitudes.join(' + ');
  }

  // 生成防守态度词
  function generateDefenseAttitude(stats, scores, config) {

    var thresholds = config.attitude_thresholds;
    var dealRate = (stats['放铳率'] || 0) * 100;
    var bombRate = (stats['被炸率'] || 0) * 100;
    var motenRate = (stats['默听率'] || 0) * 100;

    // 防守强度
    if (dealRate < thresholds.铁壁.放铳率 && scores.放铳控制 > thresholds.铁壁.放铳控制) {
      return '铁壁';
    } else if (dealRate < thresholds.防守稳健.放铳率 && scores.放铳控制 > thresholds.防守稳健.放铳控制) {
      return '防守稳健';
    } else if (dealRate > thresholds.防守弱.放铳率) {
      return '防守弱';
    }

    // 隐蔽性
    if (motenRate > thresholds.隐蔽高手.默听率 && scores.隐蔽性 > thresholds.隐蔽高手.隐蔽性) {
      return '隐蔽高手';
    }

    // 大牌防守
    if (bombRate > thresholds.大牌防守差.被炸率 && scores.大牌防守 < thresholds.大牌防守差.大牌防守) {
      return '大牌防守差';
    }
    return '防守正常';
  }

  // ========== 工具函数 ==========

  // 归一化分数
  function normalizeScore$1(value, min, max, outMin, outMax) {

    var normalized = (value - min) / (max - min);
    normalized = Math.min(1, Math.max(0, normalized));
    return outMin + normalized * (outMax - outMin);
  }

  // 获取强度等级
  function getStrengthLevel(score, type) {

    var config = loadConfig();
    var levels = config.strength_levels[type];

    // 从高到低查找匹配的等级
    for (var i = 0; i < levels.length; i++) {
      if (score >= levels[i].threshold) {
        return levels[i];
      }
    }

    // 默认返回最低等级
    return levels[levels.length - 1];
  }

  // 策略建议生成（增强版）
  function generateAdvice(analysis, stats) {

    var archetype = detectArchetype(stats);
    return {
      危险度: calculateDangerLevel(analysis, stats),
      原型: archetype,
      进攻强度: evaluateAttackStrength(stats),
      防守强度: evaluateDefenseStrength(stats),
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

  // 危险度计算（config 驱动 - 所有归一化范围来自 danger_normalization）
  function calculateDangerLevel(analysis, stats) {

    var DANGER_WEIGHTS = getDangerWeights();
    var DANGER_NORM = getDangerNormalization();
    var weightedSum = 0;
    var totalWeight = 0;
    var scores = {};
    for (var field in DANGER_WEIGHTS) {
      if (!DANGER_WEIGHTS.hasOwnProperty(field)) continue;
      var norm = DANGER_NORM[field];
      var weight = DANGER_WEIGHTS[field];
      var value = stats[field] || 0;
      var score = normalizeScore(value, norm.min, norm.max, norm.inverted);
      scores[field] = score;
      weightedSum += score * weight;
      totalWeight += weight;
    }
    var rawScore = weightedSum / totalWeight;

    // 置信度：向中性值 5 收缩，而非直接缩放
    var sampleSize = stats['count'] || 0;
    var confidence = calculateConfidence(sampleSize);
    var dangerLevel = 5 + (rawScore - 5) * confidence;
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
      置信度: (confidence * 100).toFixed(0) + '%',
      维度得分: scores
    };
  }

  // 归一化分数到 0-10，inverted=true 时反向（值越小得分越高）
  function normalizeScore(value, min, max, inverted) {
    var normalized = (value - min) / (max - min);
    normalized = Math.min(1, Math.max(0, normalized));
    if (inverted) normalized = 1 - normalized;
    return normalized * 10;
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

  // UI 设计令牌 - 所有视觉设计的唯一真实来源
  // 修改此文件即可调整整体 UI 风格，无需触碰组件代码

  // 颜色系统
  var COLORS = {
    // 语义色
    title: '#ffd700',
    // 原型称号 - 金色
    playerName: '#aaa',
    // 风格标签 - 橙色
    strategyTitle: '#4fc3f7',
    // 策略建议标题 - 浅蓝
    secondary: '#999',
    // 次要说明文字
    text: '#fff',
    // 主文字
    textMuted: '#ddd',
    // 弱化文字
    divider: 'rgba(255,255,255,0.2)',
    // 分隔线
    hint: '#666',
    // 折叠提示文字

    // 偏差色（正偏差=红，负偏差=绿，表示相对段位基准的偏离）
    deviation: {
      posStrong: '#ff4444',
      // 正偏差强（>2x threshold）
      posMid: '#ff6b6b',
      // 正偏差中
      posWeak: '#ff9999',
      // 正偏差弱
      negStrong: '#44ff44',
      // 负偏差强
      negMid: '#51cf66',
      // 负偏差中
      negWeak: '#99ff99',
      // 负偏差弱
      neutral: '#aaa' // 无偏差
    },
    // 危险度色（同时用于策略建议优先级色阶）
    danger: {
      critical: '#ff1744',
      // 9-10 极危险
      high: '#ff9800',
      // 7-8  高危
      medium: '#ffc107',
      // 5-6  中等
      low: '#8bc34a',
      // 3-4  较低
      safe: '#4caf50' // 0-2  安全
    }
  };

  // 背景与阴影
  var BACKGROUNDS = {
    card: 'rgba(0,0,0,0.75)',
    cardDim: 'rgba(0,0,0,0.5)',
    // 无数据状态
    shadow: '0 0 10px rgba(0,0,0,0.5)'
  };

  // 布局
  var LAYOUT = {
    zIndex: 10000,
    borderRadius: '8px',
    padding: '6px 10px',
    maxWidthCompact: '200px',
    maxWidthExpanded: '280px',
    // 四角定位（自己=左下，对手按计数器顺序分配）
    positions: {
      self: 'bottom: 140px; left: 10px;',
      opponents: ['top: 140px; right: 10px;',
      // 右上角
      'top: 10px; right: 10px;',
      // 右上角（靠上）
      'top: 140px; left: 10px;' // 左上角
      ]
    }
  };

  // 字体
  var TYPOGRAPHY = {
    title: {
      size: '11px',
      weight: 'bold'
    },
    body: {
      size: '9px'
    },
    aux: {
      size: '8px'
    },
    lineHeight: '1.4'
  };

  // 根据偏差值计算颜色深浅
  function getColor(deviation, threshold) {
    var absValue = Math.abs(deviation);
    if (deviation > 0) {
      if (absValue > threshold * 2) return COLORS.deviation.posStrong;
      if (absValue > threshold) return COLORS.deviation.posMid;
      return COLORS.deviation.posWeak;
    } else if (deviation < 0) {
      if (absValue > threshold * 2) return COLORS.deviation.negStrong;
      if (absValue > threshold) return COLORS.deviation.negMid;
      return COLORS.deviation.negWeak;
    } else {
      return COLORS.deviation.neutral;
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
    container.style.cssText = ['position: fixed', 'background: ' + BACKGROUNDS.cardDim, 'color: ' + COLORS.playerName, 'padding: ' + LAYOUT.padding, 'border-radius: ' + LAYOUT.borderRadius, 'font-size: ' + TYPOGRAPHY.body.size, 'z-index: ' + LAYOUT.zIndex, 'box-shadow: ' + BACKGROUNDS.shadow, 'pointer-events: none', 'width: auto', 'white-space: nowrap'].join('; ') + '; ';
    if (isSelf) {
      container.style.cssText += LAYOUT.positions.self;
    } else {
      if (typeof window.majstyleJS === 'undefined') window.majstyleJS = {};
      if (typeof window.majstyleJS.playerUICounter === 'undefined') window.majstyleJS.playerUICounter = 0;
      container.style.cssText += LAYOUT.positions.opponents[window.majstyleJS.playerUICounter % 3];
      window.majstyleJS.playerUICounter++;
    }
    var html = '<div style="color: ' + COLORS.playerName + '; font-size: ' + TYPOGRAPHY.body.size + ';">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</div>';
    html += '<div style="color: ' + COLORS.hint + '; font-size: ' + TYPOGRAPHY.aux.size + '; margin-top: 2px;">无牌谱数据</div>';
    container.innerHTML = html;
    document.body.appendChild(container);
  }

  // 创建玩家风格信息UI（增强版）
  function createPlayerInfoUI(index, 主称号, 标签, 数据, 偏差, baseline, nickname, isSelf, archetype, advice) {
    var existingUI = document.getElementById('player-style-' + index);
    if (existingUI) {
      existingUI.remove();
    }
    var container = document.createElement('div');
    container.id = 'player-style-' + index;
    container.className = 'majsoul-style-info';
    container.style.cssText = ['position: fixed', 'background: ' + BACKGROUNDS.card, 'color: ' + COLORS.text, 'padding: ' + LAYOUT.padding, 'border-radius: ' + LAYOUT.borderRadius, 'font-size: ' + TYPOGRAPHY.body.size, 'z-index: ' + LAYOUT.zIndex, 'box-shadow: ' + BACKGROUNDS.shadow, 'pointer-events: auto', 'width: auto', 'max-width: ' + LAYOUT.maxWidthCompact, 'cursor: pointer', 'transition: all 0.2s ease'].join('; ') + '; ';
    if (isSelf) {
      container.style.cssText += LAYOUT.positions.self;
    } else {
      if (typeof window.majstyleJS === 'undefined') window.majstyleJS = {};
      if (typeof window.majstyleJS.playerUICounter === 'undefined') window.majstyleJS.playerUICounter = 0;
      container.style.cssText += LAYOUT.positions.opponents[window.majstyleJS.playerUICounter % 3];
      window.majstyleJS.playerUICounter++;
    }
    var titleText = archetype ? archetype.icon + ' ' + archetype.name : 主称号;
    var playerNameHtml = '<span style="color: ' + COLORS.playerName + '; font-size: ' + TYPOGRAPHY.aux.size + ';">' + escapeHtml(nickname) + (isSelf ? ' [你]' : '') + '</span>';
    var titleStyle = 'font-weight: ' + TYPOGRAPHY.title.weight + '; font-size: ' + TYPOGRAPHY.title.size + '; color: ' + COLORS.title + '; margin-bottom: 4px;';
    var dividerStyle = 'border-top: 1px solid ' + COLORS.divider + '; padding-top: 4px; margin-top: 4px;';

    // ── 精简视图 ──
    var compactHtml = '<div style="' + titleStyle + '">【' + escapeHtml(titleText) + '】' + playerNameHtml + '</div>';
    if (advice && advice.进攻强度 && advice.防守强度) {
      compactHtml += '<div style="font-size: ' + TYPOGRAPHY.body.size + '; line-height: ' + TYPOGRAPHY.lineHeight + ';">';
      compactHtml += '⚔️ <span style="color: ' + advice.进攻强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.进攻强度.标签) + '</span> ';
      compactHtml += '🛡️ <span style="color: ' + advice.防守强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.防守强度.标签) + '</span>';
      compactHtml += '</div>';
    }
    if (advice && advice.危险度) {
      compactHtml += '<div style="font-size: ' + TYPOGRAPHY.body.size + '; color: ' + getDangerColor(advice.危险度.分数) + '; margin-top: 2px;">';
      compactHtml += advice.危险度.图标 + ' ' + advice.危险度.分数 + '/10';
      compactHtml += '</div>';
    }
    compactHtml += '<div style="font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.hint + '; margin-top: 4px; text-align: center;">▼ 点击展开</div>';

    // ── 详细视图 ──
    var detailHtml = '<div style="' + titleStyle + '">【' + escapeHtml(titleText) + '】' + playerNameHtml + '</div>';
    if (advice && advice.进攻强度 && advice.防守强度) {
      detailHtml += '<div style="margin-bottom: 4px; font-size: ' + TYPOGRAPHY.body.size + '; line-height: ' + TYPOGRAPHY.lineHeight + ';">';
      detailHtml += '⚔️ <span style="color: ' + advice.进攻强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.进攻强度.标签) + '</span>';
      if (advice.进攻强度.态度词) {
        detailHtml += ' <span style="color: ' + COLORS.secondary + ';">(' + escapeHtml(advice.进攻强度.态度词) + ')</span>';
      }
      detailHtml += '<br>';
      detailHtml += '🛡️ <span style="color: ' + advice.防守强度.颜色 + '; font-weight: bold;">' + escapeHtml(advice.防守强度.标签) + '</span>';
      if (advice.防守强度.态度词) {
        detailHtml += ' <span style="color: ' + COLORS.secondary + ';">(' + escapeHtml(advice.防守强度.态度词) + ')</span>';
      }
      detailHtml += '</div>';
    }
    if (advice && advice.危险度) {
      detailHtml += '<div style="font-size: ' + TYPOGRAPHY.body.size + '; color: ' + getDangerColor(advice.危险度.分数) + '; margin-bottom: 4px;">';
      detailHtml += advice.危险度.图标 + ' 危险度: ' + advice.危险度.分数 + '/10 - ' + escapeHtml(advice.危险度.标签);
      detailHtml += '</div>';
    }
    detailHtml += '<div style="line-height: ' + TYPOGRAPHY.lineHeight + '; font-size: ' + TYPOGRAPHY.body.size + '; ' + dividerStyle + '">';
    var 立直偏差 = (数据.立直率 - baseline.立直率).toFixed(1);
    var 副露偏差 = (数据.副露率 - baseline.副露率).toFixed(1);
    var 和牌偏差 = (数据.和牌率 - baseline.和牌率).toFixed(1);
    var 放铳偏差 = 偏差.放铳率.toFixed(1);
    var 打点偏差 = 偏差.打点.toFixed(0);
    detailHtml += '<div>立直: <span style="color: ' + getColor(parseFloat(立直偏差), 2) + '">' + 数据.立直率.toFixed(1) + '% (' + (立直偏差 > 0 ? '+' : '') + 立直偏差 + '%)</span></div>';
    detailHtml += '<div>副露: <span style="color: ' + getColor(parseFloat(副露偏差), 3) + '">' + 数据.副露率.toFixed(1) + '% (' + (副露偏差 > 0 ? '+' : '') + 副露偏差 + '%)</span></div>';
    detailHtml += '<div>和牌: <span style="color: ' + getColor(parseFloat(和牌偏差), 1.5) + '">' + 数据.和牌率.toFixed(1) + '% (' + (和牌偏差 > 0 ? '+' : '') + 和牌偏差 + '%)</span></div>';
    detailHtml += '<div>放铳: <span style="color: ' + getColor(parseFloat(放铳偏差), 1.5) + '">' + 数据.放铳率.toFixed(1) + '% (' + (放铳偏差 > 0 ? '+' : '') + 放铳偏差 + '%)</span></div>';
    detailHtml += '<div>打点: <span style="color: ' + getColor(parseFloat(打点偏差), 300) + '">' + 数据.平均打点 + ' (' + (打点偏差 > 0 ? '+' : '') + 打点偏差 + ')</span></div>';
    detailHtml += '</div>';
    if (advice && advice.策略建议 && advice.策略建议.length > 0) {
      detailHtml += '<div style="' + dividerStyle + '">';
      detailHtml += '<div style="font-weight: bold; font-size: ' + TYPOGRAPHY.body.size + '; color: ' + COLORS.strategyTitle + '; margin-bottom: 4px;">策略建议:</div>';
      for (var i = 0; i < Math.min(advice.策略建议.length, 3); i++) {
        var strategy = advice.策略建议[i];
        if (typeof strategy === 'string') {
          detailHtml += '<div style="margin-bottom: 4px; font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.textMuted + ';">• ' + escapeHtml(strategy) + '</div>';
        } else {
          var priorityColor = getPriorityColor(strategy.优先级);
          detailHtml += '<div style="margin-bottom: 4px; font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.textMuted + '; border-left: 2px solid ' + priorityColor + '; padding-left: 4px;">';
          detailHtml += '• ' + escapeHtml(strategy.建议);
          detailHtml += '</div>';
        }
      }
      detailHtml += '</div>';
    }
    detailHtml += '<div style="font-size: ' + TYPOGRAPHY.aux.size + '; color: ' + COLORS.hint + '; margin-top: 4px; text-align: center;">▲ 点击收起</div>';
    var html = '<div class="compact-view">' + compactHtml + '</div>';
    html += '<div class="detail-view" style="display: none;">' + detailHtml + '</div>';
    container.innerHTML = html;
    document.body.appendChild(container);
    container.addEventListener('click', function (e) {
      e.stopPropagation();
      var compactView = container.querySelector('.compact-view');
      var detailView = container.querySelector('.detail-view');
      if (compactView.style.display === 'none') {
        compactView.style.display = 'block';
        detailView.style.display = 'none';
        container.style.maxWidth = LAYOUT.maxWidthCompact;
      } else {
        compactView.style.display = 'none';
        detailView.style.display = 'block';
        container.style.maxWidth = LAYOUT.maxWidthExpanded;
      }
    });
  }

  // 危险度颜色（使用设计令牌）
  function getDangerColor(score) {
    if (score >= 9) return COLORS.danger.critical;
    if (score >= 7) return COLORS.danger.high;
    if (score >= 5) return COLORS.danger.medium;
    if (score >= 3) return COLORS.danger.low;
    return COLORS.danger.safe;
  }

  // 优先级颜色（复用危险度色阶）
  function getPriorityColor(priority) {
    if (priority >= 8) return COLORS.danger.critical;
    if (priority >= 6) return COLORS.danger.high;
    if (priority >= 4) return COLORS.danger.medium;
    if (priority >= 2) return COLORS.danger.low;
    return COLORS.danger.safe;
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

    // 输出强度信息
    if (advice.进攻强度 && advice.防守强度) {
      console.log('  【强度评估】');
      console.log('    ⚔️ 进攻强度: ' + advice.进攻强度.标签 + ' (' + advice.进攻强度.态度词 + ')');
      console.log('       总分: ' + advice.进攻强度.总分.toFixed(1) + '/100');
      console.log('       立直进攻: ' + advice.进攻强度.子维度.立直进攻.toFixed(1) + '/10');
      console.log('       副露进攻: ' + advice.进攻强度.子维度.副露进攻.toFixed(1) + '/10');
      console.log('       速度: ' + advice.进攻强度.子维度.速度.toFixed(1) + '/10');
      console.log('       打点: ' + advice.进攻强度.子维度.打点.toFixed(1) + '/10');
      console.log('  ');
      console.log('    🛡️ 防守强度: ' + advice.防守强度.标签 + ' (' + advice.防守强度.态度词 + ')');
      console.log('       总分: ' + advice.防守强度.总分.toFixed(1) + '/100');
      console.log('       放铳控制: ' + advice.防守强度.子维度.放铳控制.toFixed(1) + '/10');
      console.log('       大牌防守: ' + advice.防守强度.子维度.大牌防守.toFixed(1) + '/10');
      console.log('       隐蔽性: ' + advice.防守强度.子维度.隐蔽性.toFixed(1) + '/10');
      console.log('       立直防守: ' + advice.防守强度.子维度.立直防守.toFixed(1) + '/10');
      console.log('  ');
    }
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
