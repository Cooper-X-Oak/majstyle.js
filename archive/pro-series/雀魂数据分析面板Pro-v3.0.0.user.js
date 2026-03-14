// ==UserScript==
// @name         雀魂数据分析面板 Pro
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  金之间/玉之间四人麻将数据分析工具 - 交互式可视化面板
// @match        https://game.maj-soul.com/*
// @match        https://game.maj-soul.net/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      5-data.amae-koromo.com
// @connect      cdn.jsdelivr.net
// @require      https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js
// ==/UserScript==

(function() {
    'use strict';

    var gameWindow = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;

    // ==================== 常量定义 ====================

    var LEVEL_BASELINE = {
        10301: { name: '士3', 立直率: 19.66, 副露率: 35.83, 和牌率: 21.08, 放铳率: 17.55, 平均打点: 6688 },
        10401: { name: '杰1', 立直率: 19.81, 副露率: 35.44, 和牌率: 21.55, 放铳率: 16.81, 平均打点: 6639 },
        10402: { name: '杰2', 立直率: 19.90, 副露率: 34.80, 和牌率: 22.22, 放铳率: 15.92, 平均打点: 6663 },
        10403: { name: '杰3', 立直率: 19.58, 副露率: 33.74, 和牌率: 22.25, 放铳率: 15.08, 平均打点: 6651 },
        10501: { name: '豪1', 立直率: 19.35, 副露率: 32.51, 和牌率: 22.20, 放铳率: 14.12, 平均打点: 6634 },
        10502: { name: '豪2', 立直率: 19.02, 副露率: 32.06, 和牌率: 22.04, 放铳率: 13.49, 平均打点: 6597 },
        10503: { name: '豪3', 立直率: 18.77, 副露率: 32.03, 和牌率: 22.14, 放铳率: 12.93, 平均打点: 6571 },
        10601: { name: '圣1', 立直率: 18.54, 副露率: 32.04, 和牌率: 22.14, 放铳率: 12.45, 平均打点: 6538 },
        10602: { name: '圣2', 立直率: 18.47, 副露率: 32.03, 和牌率: 22.12, 放铳率: 12.14, 平均打点: 6520 },
        10603: { name: '圣3', 立直率: 18.38, 副露率: 32.36, 和牌率: 22.37, 放铳率: 11.73, 平均打点: 6485 },
        10701: { name: '魂1', 立直率: 18.25, 副露率: 32.68, 和牌率: 22.56, 放铳率: 11.41, 平均打点: 6472 }
    };

    var DEFAULT_BASELINE = LEVEL_BASELINE[10403];

    var PLAYER_COLORS = [
        { border: 'rgb(255, 99, 132)', bg: 'rgba(255, 99, 132, 0.2)' },
        { border: 'rgb(54, 162, 235)', bg: 'rgba(54, 162, 235, 0.2)' },
        { border: 'rgb(75, 192, 192)', bg: 'rgba(75, 192, 192, 0.2)' },
        { border: 'rgb(255, 206, 86)', bg: 'rgba(255, 206, 86, 0.2)' }
    ];

    // ==================== Chart.js 加载检测 ====================

    var chartJsLoaded = false;
    var chartJsLoadTimeout = null;

    function waitForChartJs(callback) {
        if (typeof Chart !== 'undefined') {
            chartJsLoaded = true;
            callback();
        } else {
            chartJsLoadTimeout = setTimeout(function() {
                if (!chartJsLoaded) {
                    console.error('[面板Pro] Chart.js 加载超时，图表功能将不可用');
                    alert('图表库加载失败，面板将以纯文本模式运行');
                }
            }, 10000);

            var checkInterval = setInterval(function() {
                if (typeof Chart !== 'undefined') {
                    chartJsLoaded = true;
                    clearInterval(checkInterval);
                    clearTimeout(chartJsLoadTimeout);
                    callback();
                }
            }, 100);
        }
    }

    // ==================== EventBus 事件总线 ====================

    var EventBus = {
        events: {},
        on: function(event, callback) {
            if (!this.events[event]) {
                this.events[event] = [];
            }
            this.events[event].push(callback);
        },
        emit: function(event, data) {
            if (this.events[event]) {
                this.events[event].forEach(function(callback) {
                    callback(data);
                });
            }
        },
        off: function(event, callback) {
            if (!this.events[event]) return;
            if (!callback) {
                delete this.events[event];
                return;
            }
            this.events[event] = this.events[event].filter(function(cb) {
                return cb !== callback;
            });
        }
    };

    // ==================== 全局状态 ====================

    var DashboardState = {
        isOpen: false,
        position: { x: 100, y: 100 },
        size: { width: 800, height: 600 },
        compareList: [],
        currentChart: 'radar',
        cache: {},
        radarChart: null,
        barChart: null
    };

    // ==================== ResizeObserver Polyfill 检测 ====================

    var hasResizeObserver = typeof ResizeObserver !== 'undefined';

    function observeResize(element, callback) {
        if (hasResizeObserver) {
            var observer = new ResizeObserver(callback);
            observer.observe(element);
            return observer;
        } else {
            // 降级到 window.resize
            var resizeHandler = function() {
                callback();
            };
            window.addEventListener('resize', resizeHandler);
            return {
                disconnect: function() {
                    window.removeEventListener('resize', resizeHandler);
                }
            };
        }
    }

    // ==================== DashboardPanel 命名空间 ====================

    var DashboardPanel = {
        // UI 管理模块
        UI: {
            panel: null,
            floatingButton: null,
            resizeObserver: null
        },

        // 搜索模块
        Search: {
            searchInput: null,
            searchButton: null,
            addCurrentButton: null,
            resultsContainer: null
        },

        // 对比模块
        Comparison: {
            listContainer: null,
            compareList: []
        },

        // 图表模块
        Chart: {
            radarCanvas: null,
            barCanvas: null,
            radarChart: null,
            barChart: null
        },

        // 数据缓存模块
        Cache: {
            data: {},
            TTL: 5 * 60 * 1000 // 5分钟
        },

        // 本地存储模块
        Storage: {
            KEYS: {
                PREFERENCES: 'majsoul_panel_preferences',
                COMPARE_LIST: 'majsoul_panel_compare_list'
            }
        }
    };

    // ==================== 工具函数 ====================

    function getBaseline(levelId) {
        return LEVEL_BASELINE[levelId] || DEFAULT_BASELINE;
    }

    function debounce(func, wait) {
        var timeout;
        return function() {
            var context = this;
            var args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                func.apply(context, args);
            }, wait);
        };
    }

    // ==================== API 请求 ====================

    function getPlayerStats(accountId) {
        return new Promise(function(resolve, reject) {
            var endTime = Date.now();
            var startTime = 1262304000000;
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch(e) {
                            reject('JSON解析失败');
                        }
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() { reject('网络错误'); },
                ontimeout: function() { reject('请求超时'); }
            });
        });
    }

    function getPlayerExtendedStats(accountId) {
        return new Promise(function(resolve, reject) {
            var endTime = Date.now();
            var startTime = 1262304000000;
            var url = 'https://5-data.amae-koromo.com/api/v2/pl4/player_extended_stats/' + accountId + '/' + startTime + '/' + endTime + '?mode=12.9&tag=492541';

            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                timeout: 10000,
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            resolve(JSON.parse(response.responseText));
                        } catch(e) {
                            reject('JSON解析失败');
                        }
                    } else {
                        reject('HTTP ' + response.status);
                    }
                },
                onerror: function() { reject('网络错误'); },
                ontimeout: function() { reject('请求超时'); }
            });
        });
    }

    // ==================== 本地存储模块 ====================

    function savePreferences() {
        var prefs = {
            position: DashboardState.position,
            size: DashboardState.size,
            isMinimized: DashboardState.isMinimized || false,
            isMaximized: DashboardState.isMaximized || false
        };
        try {
            localStorage.setItem(DashboardPanel.Storage.KEYS.PREFERENCES, JSON.stringify(prefs));
        } catch(e) {
            console.error('[面板Pro] 保存偏好设置失败:', e);
        }
    }

    function loadPreferences() {
        try {
            var saved = localStorage.getItem(DashboardPanel.Storage.KEYS.PREFERENCES);
            if (saved) {
                var prefs = JSON.parse(saved);
                DashboardState.position = prefs.position || { x: 100, y: 100 };
                DashboardState.size = prefs.size || { width: 800, height: 600 };
                DashboardState.isMinimized = prefs.isMinimized || false;
                DashboardState.isMaximized = prefs.isMaximized || false;
                return prefs;
            }
        } catch(e) {
            console.error('[面板Pro] 加载偏好设置失败:', e);
        }
        // 返回默认值
        return {
            position: { x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 },
            size: { width: 800, height: 600 },
            isMinimized: false,
            isMaximized: false
        };
    }

    // ==================== 面板 UI 模块 ====================

    function createPanel() {
        var panel = document.createElement('div');
        panel.id = 'majsoul-dashboard-panel';
        panel.style.cssText =
            'position: fixed;' +
            'background: rgba(20, 20, 30, 0.95);' +
            'border: 2px solid #ffd700;' +
            'border-radius: 8px;' +
            'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);' +
            'z-index: 9999;' +
            'display: none;' +
            'flex-direction: column;' +
            'font-family: Arial, sans-serif;' +
            'color: #ffffff;';

        // 标题栏
        var titleBar = document.createElement('div');
        titleBar.className = 'panel-titlebar';
        titleBar.style.cssText =
            'background: rgba(255, 215, 0, 0.1);' +
            'padding: 10px 15px;' +
            'cursor: move;' +
            'display: flex;' +
            'justify-content: space-between;' +
            'align-items: center;' +
            'border-bottom: 1px solid #ffd700;' +
            'user-select: none;';

        var title = document.createElement('span');
        title.textContent = '🎯 雀魂数据分析面板';
        title.style.cssText = 'font-size: 16px; font-weight: bold; color: #ffd700;';

        var buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = 'display: flex; gap: 8px;';

        // 最小化按钮
        var minimizeBtn = document.createElement('button');
        minimizeBtn.textContent = '_';
        minimizeBtn.className = 'panel-btn-minimize';
        minimizeBtn.style.cssText =
            'background: none;' +
            'border: 1px solid #ffd700;' +
            'color: #ffd700;' +
            'width: 24px;' +
            'height: 24px;' +
            'cursor: pointer;' +
            'border-radius: 3px;' +
            'font-size: 16px;' +
            'line-height: 1;' +
            'padding: 0;';

        // 最大化按钮
        var maximizeBtn = document.createElement('button');
        maximizeBtn.textContent = '□';
        maximizeBtn.className = 'panel-btn-maximize';
        maximizeBtn.style.cssText = minimizeBtn.style.cssText;

        // 关闭按钮
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.className = 'panel-btn-close';
        closeBtn.style.cssText = minimizeBtn.style.cssText + 'font-size: 20px;';

        buttonGroup.appendChild(minimizeBtn);
        buttonGroup.appendChild(maximizeBtn);
        buttonGroup.appendChild(closeBtn);

        titleBar.appendChild(title);
        titleBar.appendChild(buttonGroup);

        // 内容区域
        var content = document.createElement('div');
        content.className = 'panel-content';
        content.style.cssText =
            'flex: 1;' +
            'display: flex;' +
            'flex-direction: column;' +
            'overflow: hidden;';

        // 搜索区域
        var searchArea = document.createElement('div');
        searchArea.className = 'panel-search';
        searchArea.style.cssText =
            'padding: 15px;' +
            'border-bottom: 1px solid rgba(255, 215, 0, 0.3);' +
            'display: flex;' +
            'gap: 10px;' +
            'align-items: center;';

        var searchLabel = document.createElement('span');
        searchLabel.textContent = '搜索:';
        searchLabel.style.cssText = 'color: #ffd700;';

        var searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '输入玩家ID或昵称';
        searchInput.className = 'panel-search-input';
        searchInput.style.cssText =
            'flex: 1;' +
            'padding: 6px 10px;' +
            'background: rgba(255, 255, 255, 0.1);' +
            'border: 1px solid rgba(255, 215, 0, 0.5);' +
            'border-radius: 4px;' +
            'color: #ffffff;' +
            'font-size: 14px;';

        var searchBtn = document.createElement('button');
        searchBtn.textContent = '搜索';
        searchBtn.className = 'panel-search-btn';
        searchBtn.style.cssText =
            'padding: 6px 15px;' +
            'background: #ffd700;' +
            'border: none;' +
            'border-radius: 4px;' +
            'color: #000;' +
            'font-weight: bold;' +
            'cursor: pointer;';

        var addCurrentBtn = document.createElement('button');
        addCurrentBtn.textContent = '添加当前对局';
        addCurrentBtn.className = 'panel-add-current-btn';
        addCurrentBtn.style.cssText = searchBtn.style.cssText;

        searchArea.appendChild(searchLabel);
        searchArea.appendChild(searchInput);
        searchArea.appendChild(searchBtn);
        searchArea.appendChild(addCurrentBtn);

        // 主体区域（对比列表 + 图表）
        var mainArea = document.createElement('div');
        mainArea.style.cssText =
            'flex: 1;' +
            'display: flex;' +
            'overflow: hidden;';

        // 对比列表侧边栏
        var sidebar = document.createElement('div');
        sidebar.className = 'panel-sidebar';
        sidebar.style.cssText =
            'width: 250px;' +
            'border-right: 1px solid rgba(255, 215, 0, 0.3);' +
            'display: flex;' +
            'flex-direction: column;' +
            'overflow-y: auto;';

        var sidebarHeader = document.createElement('div');
        sidebarHeader.style.cssText =
            'padding: 10px 15px;' +
            'background: rgba(255, 215, 0, 0.05);' +
            'border-bottom: 1px solid rgba(255, 215, 0, 0.3);' +
            'font-weight: bold;' +
            'color: #ffd700;';
        sidebarHeader.textContent = '对比列表 (0/4)';

        var comparisonList = document.createElement('div');
        comparisonList.className = 'panel-comparison-list';
        comparisonList.style.cssText = 'flex: 1; padding: 10px;';

        sidebar.appendChild(sidebarHeader);
        sidebar.appendChild(comparisonList);

        // 图表区域
        var chartArea = document.createElement('div');
        chartArea.className = 'panel-chart-area';
        chartArea.style.cssText =
            'flex: 1;' +
            'display: flex;' +
            'flex-direction: column;' +
            'padding: 15px;';

        // Tab 导航
        var tabNav = document.createElement('div');
        tabNav.className = 'panel-tab-nav';
        tabNav.style.cssText =
            'display: flex;' +
            'gap: 10px;' +
            'margin-bottom: 15px;' +
            'border-bottom: 1px solid rgba(255, 215, 0, 0.3);' +
            'padding-bottom: 10px;';

        var tabs = ['雷达图', '柱状图', '详细数据'];
        tabs.forEach(function(tabName, index) {
            var tab = document.createElement('button');
            tab.textContent = tabName;
            tab.className = 'panel-tab';
            tab.dataset.tab = index;
            tab.style.cssText =
                'padding: 6px 15px;' +
                'background: ' + (index === 0 ? '#ffd700' : 'rgba(255, 215, 0, 0.2)') + ';' +
                'border: 1px solid #ffd700;' +
                'border-radius: 4px;' +
                'color: ' + (index === 0 ? '#000' : '#ffd700') + ';' +
                'cursor: pointer;' +
                'font-weight: ' + (index === 0 ? 'bold' : 'normal') + ';';
            tabNav.appendChild(tab);
        });

        // 图表容器
        var chartContainer = document.createElement('div');
        chartContainer.className = 'panel-chart-container';
        chartContainer.style.cssText =
            'flex: 1;' +
            'position: relative;' +
            'display: flex;' +
            'align-items: center;' +
            'justify-content: center;';

        var radarCanvas = document.createElement('canvas');
        radarCanvas.id = 'panel-radar-chart';
        radarCanvas.style.cssText = 'max-width: 100%; max-height: 100%;';

        var barCanvas = document.createElement('canvas');
        barCanvas.id = 'panel-bar-chart';
        barCanvas.style.cssText = 'max-width: 100%; max-height: 100%; display: none;';

        var detailsTable = document.createElement('div');
        detailsTable.className = 'panel-details-table';
        detailsTable.style.cssText = 'display: none; overflow-y: auto; width: 100%;';

        chartContainer.appendChild(radarCanvas);
        chartContainer.appendChild(barCanvas);
        chartContainer.appendChild(detailsTable);

        chartArea.appendChild(tabNav);
        chartArea.appendChild(chartContainer);

        mainArea.appendChild(sidebar);
        mainArea.appendChild(chartArea);

        content.appendChild(searchArea);
        content.appendChild(mainArea);

        // 调整大小手柄
        var resizeHandle = document.createElement('div');
        resizeHandle.className = 'panel-resize-handle';
        resizeHandle.style.cssText =
            'position: absolute;' +
            'bottom: 0;' +
            'right: 0;' +
            'width: 20px;' +
            'height: 20px;' +
            'cursor: nwse-resize;' +
            'background: linear-gradient(135deg, transparent 50%, #ffd700 50%);';

        panel.appendChild(titleBar);
        panel.appendChild(content);
        panel.appendChild(resizeHandle);

        // 保存引用
        DashboardPanel.UI.panel = panel;
        DashboardPanel.UI.titleBar = titleBar;
        DashboardPanel.UI.minimizeBtn = minimizeBtn;
        DashboardPanel.UI.maximizeBtn = maximizeBtn;
        DashboardPanel.UI.closeBtn = closeBtn;
        DashboardPanel.UI.resizeHandle = resizeHandle;
        DashboardPanel.Search.searchInput = searchInput;
        DashboardPanel.Search.searchButton = searchBtn;
        DashboardPanel.Search.addCurrentButton = addCurrentBtn;
        DashboardPanel.Comparison.listContainer = comparisonList;
        DashboardPanel.Comparison.headerElement = sidebarHeader;
        DashboardPanel.Chart.radarCanvas = radarCanvas;
        DashboardPanel.Chart.barCanvas = barCanvas;
        DashboardPanel.Chart.detailsTable = detailsTable;
        DashboardPanel.Chart.tabNav = tabNav;

        document.body.appendChild(panel);
        return panel;
    }

    function createFloatingButton() {
        var btn = document.createElement('button');
        btn.id = 'majsoul-dashboard-float-btn';
        btn.textContent = '📊';
        btn.style.cssText =
            'position: fixed;' +
            'bottom: 20px;' +
            'right: 20px;' +
            'width: 50px;' +
            'height: 50px;' +
            'background: rgba(255, 215, 0, 0.9);' +
            'border: 2px solid #ffd700;' +
            'border-radius: 50%;' +
            'font-size: 24px;' +
            'cursor: pointer;' +
            'z-index: 9998;' +
            'box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);' +
            'transition: transform 0.2s;';

        btn.addEventListener('mouseenter', function() {
            btn.style.transform = 'scale(1.1)';
        });

        btn.addEventListener('mouseleave', function() {
            btn.style.transform = 'scale(1)';
        });

        btn.addEventListener('click', function() {
            togglePanel();
        });

        DashboardPanel.UI.floatingButton = btn;
        document.body.appendChild(btn);
        return btn;
    }

    function togglePanel() {
        var panel = DashboardPanel.UI.panel;
        if (!panel) return;

        if (DashboardState.isOpen) {
            // 关闭面板
            panel.style.display = 'none';
            DashboardState.isOpen = false;
            savePreferences();
            EventBus.emit('panel:closed');
        } else {
            // 打开面板
            var prefs = loadPreferences();
            panel.style.left = prefs.position.x + 'px';
            panel.style.top = prefs.position.y + 'px';
            panel.style.width = prefs.size.width + 'px';
            panel.style.height = prefs.size.height + 'px';
            panel.style.display = 'flex';
            DashboardState.isOpen = true;
            EventBus.emit('panel:opened');
        }
    }

    // ==================== 拖拽功能 ====================

    var dragState = {
        isDragging: false,
        startX: 0,
        startY: 0,
        offsetX: 0,
        offsetY: 0
    };

    function initDragging() {
        var titleBar = DashboardPanel.UI.titleBar;
        var panel = DashboardPanel.UI.panel;

        titleBar.addEventListener('mousedown', function(e) {
            if (e.target.tagName === 'BUTTON') return; // 不在按钮上拖拽

            dragState.isDragging = true;
            dragState.startX = e.clientX;
            dragState.startY = e.clientY;
            dragState.offsetX = e.clientX - panel.offsetLeft;
            dragState.offsetY = e.clientY - panel.offsetTop;
            titleBar.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', function(e) {
            if (!dragState.isDragging) return;

            var newX = e.clientX - dragState.offsetX;
            var newY = e.clientY - dragState.offsetY;

            panel.style.left = newX + 'px';
            panel.style.top = newY + 'px';

            DashboardState.position.x = newX;
            DashboardState.position.y = newY;
        });

        document.addEventListener('mouseup', function() {
            if (dragState.isDragging) {
                dragState.isDragging = false;
                titleBar.style.cursor = 'move';
                savePreferences();
            }
        });
    }

    // ==================== 调整大小功能 ====================

    var resizeState = {
        isResizing: false,
        startX: 0,
        startY: 0,
        startWidth: 0,
        startHeight: 0
    };

    function initResizing() {
        var handle = DashboardPanel.UI.resizeHandle;
        var panel = DashboardPanel.UI.panel;

        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            resizeState.isResizing = true;
            resizeState.startX = e.clientX;
            resizeState.startY = e.clientY;
            resizeState.startWidth = panel.offsetWidth;
            resizeState.startHeight = panel.offsetHeight;
        });

        document.addEventListener('mousemove', function(e) {
            if (!resizeState.isResizing) return;

            var deltaX = e.clientX - resizeState.startX;
            var deltaY = e.clientY - resizeState.startY;

            var newWidth = resizeState.startWidth + deltaX;
            var newHeight = resizeState.startHeight + deltaY;

            // 限制最小和最大尺寸
            newWidth = Math.max(600, Math.min(1200, newWidth));
            newHeight = Math.max(400, Math.min(800, newHeight));

            panel.style.width = newWidth + 'px';
            panel.style.height = newHeight + 'px';

            DashboardState.size.width = newWidth;
            DashboardState.size.height = newHeight;

            // 触发图表调整
            EventBus.emit('panel:resized');
        });

        document.addEventListener('mouseup', function() {
            if (resizeState.isResizing) {
                resizeState.isResizing = false;
                savePreferences();
            }
        });
    }

    // ==================== 最小化/最大化功能 ====================

    function initMinMaxButtons() {
        var panel = DashboardPanel.UI.panel;
        var minimizeBtn = DashboardPanel.UI.minimizeBtn;
        var maximizeBtn = DashboardPanel.UI.maximizeBtn;
        var closeBtn = DashboardPanel.UI.closeBtn;
        var content = panel.querySelector('.panel-content');

        var savedSize = { width: 800, height: 600 };

        // 最小化
        minimizeBtn.addEventListener('click', function() {
            if (DashboardState.isMinimized) {
                // 恢复
                content.style.display = 'flex';
                panel.style.height = savedSize.height + 'px';
                DashboardState.isMinimized = false;
                minimizeBtn.textContent = '_';
            } else {
                // 最小化
                savedSize.height = panel.offsetHeight;
                content.style.display = 'none';
                panel.style.height = 'auto';
                DashboardState.isMinimized = true;
                minimizeBtn.textContent = '▢';
            }
            savePreferences();
        });

        // 最大化
        maximizeBtn.addEventListener('click', function() {
            if (DashboardState.isMaximized) {
                // 恢复
                panel.style.width = savedSize.width + 'px';
                panel.style.height = savedSize.height + 'px';
                DashboardState.isMaximized = false;
                maximizeBtn.textContent = '□';
            } else {
                // 最大化
                savedSize.width = panel.offsetWidth;
                savedSize.height = panel.offsetHeight;
                panel.style.width = '1200px';
                panel.style.height = '800px';
                DashboardState.isMaximized = true;
                maximizeBtn.textContent = '❐';
            }
            savePreferences();
            EventBus.emit('panel:resized');
        });

        // 关闭
        closeBtn.addEventListener('click', function() {
            togglePanel();
        });
    }

    // ==================== 键盘快捷键 ====================

    function initKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+Shift+D
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                togglePanel();
            }
        });
    }

    // ==================== 数据缓存模块 ====================

    var DataCache = {
        data: {},
        TTL: 5 * 60 * 1000, // 5分钟
        MAX_SIZE: 50,

        set: function(key, value) {
            this.data[key] = {
                value: value,
                timestamp: Date.now()
            };
            this.enforceLimit();
        },

        get: function(key) {
            var entry = this.data[key];
            if (!entry) return null;

            // 检查是否过期
            if (Date.now() - entry.timestamp > this.TTL) {
                delete this.data[key];
                return null;
            }

            return entry.value;
        },

        getAge: function(key) {
            var entry = this.data[key];
            if (!entry) return null;
            return Math.floor((Date.now() - entry.timestamp) / 1000 / 60); // 返回分钟数
        },

        has: function(key) {
            return this.get(key) !== null;
        },

        remove: function(key) {
            delete this.data[key];
        },

        clear: function() {
            this.data = {};
        },

        clearExpired: function() {
            var now = Date.now();
            var keys = Object.keys(this.data);
            keys.forEach(function(key) {
                if (now - this.data[key].timestamp > this.TTL) {
                    delete this.data[key];
                }
            }.bind(this));
        },

        enforceLimit: function() {
            var keys = Object.keys(this.data);
            if (keys.length <= this.MAX_SIZE) return;

            // 按时间戳排序，删除最旧的
            var sorted = keys.sort(function(a, b) {
                return this.data[a].timestamp - this.data[b].timestamp;
            }.bind(this));

            var toRemove = sorted.slice(0, keys.length - this.MAX_SIZE);
            toRemove.forEach(function(key) {
                delete this.data[key];
            }.bind(this));
        },

        getSize: function() {
            return Object.keys(this.data).length;
        }
    };

    // 包装 API 调用，添加缓存
    function getCachedPlayerStats(accountId, forceRefresh) {
        var cacheKey = 'stats_' + accountId;

        if (!forceRefresh) {
            var cached = DataCache.get(cacheKey);
            if (cached) {
                console.log('[面板Pro] 使用缓存数据:', accountId);
                return Promise.resolve(cached);
            }
        }

        return getPlayerStats(accountId).then(function(data) {
            DataCache.set(cacheKey, data);
            return data;
        });
    }

    function getCachedPlayerExtendedStats(accountId, forceRefresh) {
        var cacheKey = 'ext_stats_' + accountId;

        if (!forceRefresh) {
            var cached = DataCache.get(cacheKey);
            if (cached) {
                console.log('[面板Pro] 使用缓存扩展数据:', accountId);
                return Promise.resolve(cached);
            }
        }

        return getPlayerExtendedStats(accountId).then(function(data) {
            DataCache.set(cacheKey, data);
            return data;
        });
    }

    function refreshPlayerData(accountId) {
        // 清除缓存并重新获取
        DataCache.remove('stats_' + accountId);
        DataCache.remove('ext_stats_' + accountId);

        return getCachedPlayerStats(accountId, true)
            .then(function(basicStats) {
                return getCachedPlayerExtendedStats(accountId, true)
                    .then(function(extStats) {
                        return { basicStats: basicStats, extStats: extStats };
                    });
            });
    }

    function refreshAllComparisonPlayers() {
        if (DashboardState.compareList.length === 0) {
            alert('对比列表为空');
            return;
        }

        var promises = DashboardState.compareList.map(function(player) {
            return refreshPlayerData(player.account_id)
                .then(function(data) {
                    // 更新玩家数据
                    player.basicStats = data.basicStats;
                    player.extendedStats = data.extStats;
                    return player;
                })
                .catch(function(e) {
                    console.error('[面板Pro] 刷新玩家数据失败:', player.nickname, e);
                    return player; // 保留旧数据
                });
        });

        Promise.all(promises).then(function() {
            updateComparisonList();
            EventBus.emit('data:refreshed');
            alert('数据刷新完成');
        });
    }

    // ==================== 搜索模块 ====================

    var searchResultsContainer = null;

    function createSearchResultsContainer() {
        if (searchResultsContainer) return searchResultsContainer;

        var container = document.createElement('div');
        container.className = 'panel-search-results';
        container.style.cssText =
            'position: absolute;' +
            'top: 100%;' +
            'left: 0;' +
            'right: 0;' +
            'max-height: 300px;' +
            'overflow-y: auto;' +
            'background: rgba(20, 20, 30, 0.98);' +
            'border: 1px solid #ffd700;' +
            'border-top: none;' +
            'z-index: 10000;' +
            'display: none;';

        var searchArea = DashboardPanel.UI.panel.querySelector('.panel-search');
        searchArea.style.position = 'relative';
        searchArea.appendChild(container);
        searchResultsContainer = container;
        return container;
    }

    function showSearchResults() {
        if (!searchResultsContainer) createSearchResultsContainer();
        searchResultsContainer.style.display = 'block';
    }

    function hideSearchResults() {
        if (searchResultsContainer) {
            searchResultsContainer.style.display = 'none';
        }
    }

    function clearSearchResults() {
        if (searchResultsContainer) {
            searchResultsContainer.innerHTML = '';
        }
    }

    function displaySearchError(message) {
        clearSearchResults();
        var errorDiv = document.createElement('div');
        errorDiv.style.cssText =
            'padding: 15px;' +
            'color: #ff6b6b;' +
            'text-align: center;';
        errorDiv.textContent = message;
        searchResultsContainer.appendChild(errorDiv);
        showSearchResults();
    }

    function displaySearchResult(playerData, extendedData) {
        clearSearchResults();

        var card = document.createElement('div');
        card.style.cssText =
            'padding: 15px;' +
            'border-bottom: 1px solid rgba(255, 215, 0, 0.2);' +
            'cursor: pointer;' +
            'transition: background 0.2s;';

        card.addEventListener('mouseenter', function() {
            card.style.background = 'rgba(255, 215, 0, 0.1)';
        });

        card.addEventListener('mouseleave', function() {
            card.style.background = 'transparent';
        });

        // 玩家基本信息
        var header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';

        var nameSection = document.createElement('div');
        var nickname = document.createElement('div');
        nickname.style.cssText = 'font-size: 16px; font-weight: bold; color: #ffd700;';
        nickname.textContent = playerData.nickname || '未知玩家';

        var accountId = document.createElement('div');
        accountId.style.cssText = 'font-size: 12px; color: #aaa; margin-top: 3px;';
        accountId.textContent = 'ID: ' + playerData.account_id;

        nameSection.appendChild(nickname);
        nameSection.appendChild(accountId);

        // 段位信息
        var rankBadge = document.createElement('span');
        rankBadge.style.cssText =
            'padding: 4px 8px;' +
            'background: rgba(255, 215, 0, 0.2);' +
            'border: 1px solid #ffd700;' +
            'border-radius: 4px;' +
            'font-size: 12px;' +
            'color: #ffd700;';
        var levelName = playerData.level ? (LEVEL_BASELINE[playerData.level.id] || {}).name || '未知' : '未知';
        rankBadge.textContent = levelName;

        header.appendChild(nameSection);
        header.appendChild(rankBadge);

        // 缓存时间戳
        var cacheAge = DataCache.getAge('stats_' + playerData.account_id);
        if (cacheAge !== null && cacheAge > 0) {
            var cacheInfo = document.createElement('div');
            cacheInfo.style.cssText = 'font-size: 11px; color: #888; margin-bottom: 5px;';
            cacheInfo.textContent = '数据缓存于 ' + cacheAge + ' 分钟前';
            card.appendChild(cacheInfo);
        }

        // 统计信息
        var stats = document.createElement('div');
        stats.style.cssText = 'font-size: 13px; color: #ccc; margin-bottom: 10px;';

        if (extendedData && extendedData.count >= 50) {
            var gameCount = document.createElement('div');
            gameCount.textContent = '对局数: ' + extendedData.count;
            stats.appendChild(gameCount);

            // 分析风格
            var analysis = analyzePlayerStyle(extendedData, getBaseline(playerData.level ? playerData.level.id : null));

            var styleTitle = document.createElement('div');
            styleTitle.style.cssText = 'margin-top: 5px; color: #ffd700;';
            styleTitle.textContent = '风格: ' + analysis.主称号;
            stats.appendChild(styleTitle);

            if (analysis.标签.length > 0) {
                var tags = document.createElement('div');
                tags.style.cssText = 'margin-top: 5px; display: flex; gap: 5px; flex-wrap: wrap;';
                analysis.标签.slice(0, 3).forEach(function(tag) {
                    var tagSpan = document.createElement('span');
                    tagSpan.style.cssText =
                        'padding: 2px 6px;' +
                        'background: rgba(81, 207, 102, 0.2);' +
                        'border: 1px solid #51cf66;' +
                        'border-radius: 3px;' +
                        'font-size: 11px;' +
                        'color: #51cf66;';
                    tagSpan.textContent = tag;
                    tags.appendChild(tagSpan);
                });
                stats.appendChild(tags);
            }
        } else {
            var warning = document.createElement('div');
            warning.style.cssText = 'color: #ff6b6b;';
            warning.textContent = '数据不足（少于50局）';
            stats.appendChild(warning);
        }

        // 按钮组
        var buttonGroup = document.createElement('div');
        buttonGroup.style.cssText = 'display: flex; gap: 8px;';

        // 刷新按钮
        var refreshButton = document.createElement('button');
        refreshButton.textContent = '🔄 刷新';
        refreshButton.style.cssText =
            'flex: 0 0 auto;' +
            'padding: 8px 12px;' +
            'background: rgba(81, 207, 102, 0.2);' +
            'border: 1px solid #51cf66;' +
            'border-radius: 4px;' +
            'color: #51cf66;' +
            'font-weight: bold;' +
            'cursor: pointer;';

        refreshButton.addEventListener('click', function() {
            refreshButton.disabled = true;
            refreshButton.textContent = '刷新中...';
            refreshPlayerData(playerData.account_id)
                .then(function(data) {
                    displaySearchResult(data.basicStats, data.extStats);
                })
                .catch(function(e) {
                    alert('刷新失败: ' + e);
                    refreshButton.disabled = false;
                    refreshButton.textContent = '🔄 刷新';
                });
        });

        // 添加按钮
        var addButton = document.createElement('button');
        addButton.textContent = '添加到对比';
        addButton.style.cssText =
            'flex: 1;' +
            'padding: 8px;' +
            'background: #ffd700;' +
            'border: none;' +
            'border-radius: 4px;' +
            'color: #000;' +
            'font-weight: bold;' +
            'cursor: pointer;';

        // 检查是否已在对比列表
        var isInList = DashboardState.compareList.some(function(p) {
            return p.account_id === playerData.account_id;
        });

        if (isInList) {
            addButton.textContent = '已添加';
            addButton.disabled = true;
            addButton.style.background = '#666';
            addButton.style.cursor = 'not-allowed';
        } else if (DashboardState.compareList.length >= 4) {
            addButton.textContent = '对比列表已满';
            addButton.disabled = true;
            addButton.style.background = '#666';
            addButton.style.cursor = 'not-allowed';
        } else {
            addButton.addEventListener('click', function() {
                addPlayerToComparison(playerData, extendedData);
                addButton.textContent = '已添加';
                addButton.disabled = true;
                addButton.style.background = '#666';
                addButton.style.cursor = 'not-allowed';
            });
        }

        buttonGroup.appendChild(refreshButton);
        buttonGroup.appendChild(addButton);

        card.appendChild(header);
        card.appendChild(stats);
        card.appendChild(buttonGroup);

        searchResultsContainer.appendChild(card);
        showSearchResults();
    }

    function analyzePlayerStyle(extStats, baseline) {
        // 简化版风格分析
        var 立直率 = extStats.立直率 || 0;
        var 副露率 = extStats.副露率 || 0;
        var 和牌率 = extStats.和牌率 || 0;
        var 放铳率 = extStats.放铳率 || 0;
        var 平均打点 = extStats.平均打点 || 0;

        var 进攻意愿 = 立直率 + 副露率;
        var 进攻意愿偏差 = 进攻意愿 - (baseline.立直率 + baseline.副露率);
        var 放铳率偏差 = 放铳率 - baseline.放铳率;

        var 意愿类型 = 进攻意愿偏差 > 1.5 ? '高' : 进攻意愿偏差 < -1.5 ? '低' : '中';
        var 防守类型 = 放铳率偏差 < -2.0 ? '铁壁' : 放铳率偏差 > 2.0 ? '漏勺' : '正常';

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
        if (副露率 > 38) 标签.push('速攻流');
        if (立直率 > 25) 标签.push('立直狂');
        if (防守类型 === '铁壁') 标签.push('铁壁');
        if (防守类型 === '漏勺') 标签.push('漏勺');

        return {
            主称号: 主称号,
            标签: 标签,
            数据: { 立直率: 立直率, 副露率: 副露率, 和牌率: 和牌率, 放铳率: 放铳率, 平均打点: 平均打点 }
        };
    }

    function searchPlayer() {
        var input = DashboardPanel.Search.searchInput;
        var query = input.value.trim();

        if (!query) {
            displaySearchError('请输入玩家ID或昵称');
            return;
        }

        // 检查是否为纯数字（玩家ID）
        var isNumeric = /^\d+$/.test(query);

        if (isNumeric) {
            searchByPlayerId(query);
        } else {
            displaySearchError('暂不支持昵称搜索，请输入玩家ID');
        }
    }

    function searchByPlayerId(playerId) {
        clearSearchResults();

        var loading = document.createElement('div');
        loading.style.cssText = 'padding: 20px; text-align: center; color: #ffd700;';
        loading.textContent = '搜索中...';
        searchResultsContainer.appendChild(loading);
        showSearchResults();

        getCachedPlayerStats(playerId)
            .then(function(basicStats) {
                return getCachedPlayerExtendedStats(playerId)
                    .then(function(extStats) {
                        displaySearchResult(basicStats, extStats);
                    })
                    .catch(function() {
                        // 即使扩展数据失败，也显示基本信息
                        displaySearchResult(basicStats, null);
                    });
            })
            .catch(function(error) {
                if (error.includes('404') || error.includes('HTTP 404')) {
                    displaySearchError('玩家不存在或ID无效');
                } else if (error.includes('超时')) {
                    displaySearchError('请求超时，请检查网络连接');
                } else if (error.includes('429')) {
                    displaySearchError('请求过于频繁，请稍后再试');
                } else if (error.includes('500')) {
                    displaySearchError('服务器错误，请稍后再试');
                } else {
                    displaySearchError('搜索失败: ' + error);
                }
            });
    }

    function addCurrentPlayers() {
        try {
            var playerDatas = gameWindow.view.DesktopMgr.Inst.player_datas;
            if (!playerDatas || playerDatas.length === 0) {
                displaySearchError('当前不在对局中');
                return;
            }

            var addedCount = 0;
            var skippedCount = 0;

            playerDatas.forEach(function(player) {
                // 检查是否已在列表
                var isInList = DashboardState.compareList.some(function(p) {
                    return p.account_id === player.account_id;
                });

                if (!isInList && DashboardState.compareList.length < 4) {
                    // 获取玩家数据并添加
                    getCachedPlayerStats(player.account_id)
                        .then(function(basicStats) {
                            return getCachedPlayerExtendedStats(player.account_id)
                                .then(function(extStats) {
                                    addPlayerToComparison(basicStats, extStats);
                                    addedCount++;
                                });
                        })
                        .catch(function(e) {
                            console.error('[面板Pro] 获取玩家数据失败:', player.account_id, e);
                        });
                } else {
                    skippedCount++;
                }
            });

            hideSearchResults();

            if (addedCount === 0 && skippedCount > 0) {
                alert('所有玩家已在对比列表中或列表已满');
            }

        } catch(e) {
            displaySearchError('无法访问游戏数据，请确保在游戏页面中');
            console.error('[面板Pro] 添加当前对局玩家失败:', e);
        }
    }

    function addPlayerToComparison(playerData, extendedData) {
        if (DashboardState.compareList.length >= 4) {
            alert('对比列表已满（最多4个玩家）');
            return;
        }

        // 检查是否已存在
        var exists = DashboardState.compareList.some(function(p) {
            return p.account_id === playerData.account_id;
        });

        if (exists) {
            return;
        }

        var playerInfo = {
            account_id: playerData.account_id,
            nickname: playerData.nickname,
            level: playerData.level,
            basicStats: playerData,
            extendedStats: extendedData
        };

        DashboardState.compareList.push(playerInfo);
        updateComparisonList();
        EventBus.emit('player:added', playerInfo);

        console.log('[面板Pro] 添加玩家到对比列表:', playerInfo.nickname);
    }

    function removePlayerFromComparison(accountId) {
        var index = DashboardState.compareList.findIndex(function(p) {
            return p.account_id === accountId;
        });

        if (index !== -1) {
            var removed = DashboardState.compareList.splice(index, 1)[0];
            updateComparisonList();
            EventBus.emit('player:removed', removed);
            console.log('[面板Pro] 从对比列表移除玩家:', removed.nickname);
        }
    }

    function updateComparisonList() {
        var container = DashboardPanel.Comparison.listContainer;
        var header = DashboardPanel.Comparison.headerElement;

        // 更新标题
        var headerText = '对比列表 (' + DashboardState.compareList.length + '/4)';

        // 添加刷新全部按钮
        if (DashboardState.compareList.length > 0) {
            header.innerHTML = '';
            var titleSpan = document.createElement('span');
            titleSpan.textContent = headerText;

            var refreshAllBtn = document.createElement('button');
            refreshAllBtn.textContent = '🔄';
            refreshAllBtn.title = '刷新全部';
            refreshAllBtn.style.cssText =
                'float: right;' +
                'background: rgba(81, 207, 102, 0.2);' +
                'border: 1px solid #51cf66;' +
                'border-radius: 3px;' +
                'color: #51cf66;' +
                'cursor: pointer;' +
                'padding: 2px 6px;' +
                'font-size: 12px;';

            refreshAllBtn.addEventListener('click', function() {
                refreshAllComparisonPlayers();
            });

            header.appendChild(titleSpan);
            header.appendChild(refreshAllBtn);
        } else {
            header.textContent = headerText;
        }

        // 清空列表
        container.innerHTML = '';

        if (DashboardState.compareList.length === 0) {
            var emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding: 20px; text-align: center; color: #888;';
            emptyMsg.textContent = '暂无对比玩家\n请搜索添加';
            container.appendChild(emptyMsg);
            return;
        }

        // 渲染玩家列表
        DashboardState.compareList.forEach(function(player, index) {
            var item = document.createElement('div');
            item.style.cssText =
                'padding: 10px;' +
                'margin-bottom: 8px;' +
                'background: rgba(255, 215, 0, 0.05);' +
                'border: 1px solid rgba(255, 215, 0, 0.3);' +
                'border-radius: 4px;' +
                'display: flex;' +
                'align-items: center;' +
                'gap: 8px;';

            // 颜色指示器
            var colorDot = document.createElement('div');
            colorDot.style.cssText =
                'width: 12px;' +
                'height: 12px;' +
                'border-radius: 50%;' +
                'background: ' + PLAYER_COLORS[index].border + ';' +
                'flex-shrink: 0;';

            // 玩家信息
            var info = document.createElement('div');
            info.style.cssText = 'flex: 1; min-width: 0;';

            var name = document.createElement('div');
            name.style.cssText = 'font-weight: bold; color: #ffd700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
            name.textContent = player.nickname;

            var style = document.createElement('div');
            style.style.cssText = 'font-size: 11px; color: #51cf66; margin-top: 2px;';
            if (player.extendedStats && player.extendedStats.count >= 50) {
                var analysis = analyzePlayerStyle(player.extendedStats, getBaseline(player.level ? player.level.id : null));
                style.textContent = analysis.主称号;
            } else {
                style.textContent = '数据不足';
                style.style.color = '#ff6b6b';
            }

            info.appendChild(name);
            info.appendChild(style);

            // 删除按钮
            var removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.style.cssText =
                'width: 24px;' +
                'height: 24px;' +
                'background: rgba(255, 107, 107, 0.2);' +
                'border: 1px solid #ff6b6b;' +
                'border-radius: 3px;' +
                'color: #ff6b6b;' +
                'cursor: pointer;' +
                'font-size: 16px;' +
                'line-height: 1;' +
                'padding: 0;' +
                'flex-shrink: 0;';

            removeBtn.addEventListener('click', function() {
                removePlayerFromComparison(player.account_id);
            });

            item.appendChild(colorDot);
            item.appendChild(info);
            item.appendChild(removeBtn);

            container.appendChild(item);
        });
    }

    function initSearchModule() {
        var searchBtn = DashboardPanel.Search.searchButton;
        var searchInput = DashboardPanel.Search.searchInput;
        var addCurrentBtn = DashboardPanel.Search.addCurrentButton;

        // 搜索按钮点击
        searchBtn.addEventListener('click', function() {
            searchPlayer();
        });

        // 回车键搜索
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                searchPlayer();
            } else if (e.key === 'Escape') {
                searchInput.value = '';
                hideSearchResults();
            }
        });

        // 添加当前对局按钮
        addCurrentBtn.addEventListener('click', function() {
            addCurrentPlayers();
        });

        // 点击外部关闭搜索结果
        document.addEventListener('click', function(e) {
            if (!searchResultsContainer) return;
            var searchArea = DashboardPanel.UI.panel.querySelector('.panel-search');
            if (searchArea && !searchArea.contains(e.target)) {
                hideSearchResults();
            }
        });

        // 创建搜索结果容器
        createSearchResultsContainer();
    }

    // ==================== 图表模块 ====================

    // 数据归一化函数
    function normalizeData(stats, baseline) {
        if (!stats || !baseline) return null;

        var 立直率 = stats.立直率 || 0;
        var 副露率 = stats.副露率 || 0;
        var 和牌率 = stats.和牌率 || 0;
        var 放铳率 = stats.放铳率 || 0;
        var 平均打点 = stats.平均打点 || 0;

        return {
            立直率: (立直率 / baseline.立直率) * 50,
            副露率: (副露率 / baseline.副露率) * 50,
            和牌率: (和牌率 / baseline.和牌率) * 50,
            防守力: (1 - 放铳率 / baseline.放铳率) * 50 + 50,
            平均打点: (平均打点 / baseline.平均打点) * 50,
            进攻意愿: ((立直率 + 副露率) / (baseline.立直率 + baseline.副露率)) * 50
        };
    }

    // 渲染雷达图
    function renderRadarChart() {
        var canvas = DashboardPanel.Chart.radarCanvas;
        if (!canvas) return;

        var ctx = canvas.getContext('2d');

        // 如果图表已存在，先销毁
        if (DashboardPanel.Chart.radarChart) {
            DashboardPanel.Chart.radarChart.destroy();
        }

        // 准备数据集
        var datasets = [];

        // 获取最高段位的基准
        var highestBaseline = DEFAULT_BASELINE;
        DashboardState.compareList.forEach(function(player) {
            if (player.level && player.level.id) {
                var playerBaseline = getBaseline(player.level.id);
                if (playerBaseline && playerBaseline.立直率 < highestBaseline.立直率) {
                    highestBaseline = playerBaseline;
                }
            }
        });

        // 添加基准线
        datasets.push({
            label: '段位平均',
            data: [50, 50, 50, 50, 50, 50],
            borderColor: 'rgb(200, 200, 200)',
            backgroundColor: 'rgba(200, 200, 200, 0.1)',
            borderDash: [5, 5],
            borderWidth: 2,
            pointRadius: 3
        });

        // 添加玩家数据
        DashboardState.compareList.forEach(function(player, index) {
            if (!player.extendedStats || player.extendedStats.count < 50) {
                return; // 跳过数据不足的玩家
            }

            var baseline = getBaseline(player.level ? player.level.id : null);
            var normalized = normalizeData(player.extendedStats, baseline);

            if (!normalized) return;

            var color = PLAYER_COLORS[index];
            datasets.push({
                label: player.nickname,
                data: [
                    normalized.立直率,
                    normalized.副露率,
                    normalized.和牌率,
                    normalized.防守力,
                    normalized.平均打点,
                    normalized.进攻意愿
                ],
                borderColor: color.border,
                backgroundColor: color.bg,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            });
        });

        // 检查是否有有效数据
        if (datasets.length <= 1) {
            // 只有基准线，显示提示
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据，请添加玩家到对比列表', canvas.width / 2, canvas.height / 2);
            return;
        }

        // 创建图表
        DashboardPanel.Chart.radarChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['立直率', '副露率', '和牌率', '防守力', '平均打点', '进攻意愿'],
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#888',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(255, 215, 0, 0.2)'
                        },
                        pointLabels: {
                            color: '#ffd700',
                            font: {
                                size: 12
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#fff',
                            padding: 10,
                            font: {
                                size: 12
                            }
                        },
                        onClick: function(e, legendItem, legend) {
                            var index = legendItem.datasetIndex;
                            var chart = legend.chart;
                            var meta = chart.getDatasetMeta(index);
                            meta.hidden = !meta.hidden;
                            chart.update('none');
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffd700',
                        bodyColor: '#fff',
                        borderColor: '#ffd700',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                var label = context.dataset.label || '';
                                var value = context.parsed.r;

                                // 获取实际值
                                if (label !== '段位平均') {
                                    var playerIndex = context.datasetIndex - 1;
                                    var player = DashboardState.compareList[playerIndex];
                                    if (player && player.extendedStats) {
                                        var stats = player.extendedStats;
                                        var dimension = context.label;
                                        var actualValue = '';

                                        switch(dimension) {
                                            case '立直率':
                                                actualValue = stats.立直率.toFixed(1) + '%';
                                                break;
                                            case '副露率':
                                                actualValue = stats.副露率.toFixed(1) + '%';
                                                break;
                                            case '和牌率':
                                                actualValue = stats.和牌率.toFixed(1) + '%';
                                                break;
                                            case '防守力':
                                                actualValue = '放铳率 ' + stats.放铳率.toFixed(1) + '%';
                                                break;
                                            case '平均打点':
                                                actualValue = Math.round(stats.平均打点) + '点';
                                                break;
                                            case '进攻意愿':
                                                actualValue = (stats.立直率 + stats.副露率).toFixed(1) + '%';
                                                break;
                                        }

                                        return label + ': ' + value.toFixed(1) + ' (' + actualValue + ')';
                                    }
                                }

                                return label + ': ' + value.toFixed(1);
                            }
                        }
                    }
                },
                animation: false
            }
        });

        console.log('[面板Pro] 雷达图渲染完成');
    }

    // 更新雷达图（防抖版本）
    var updateRadarChartDebounced = debounce(function() {
        renderRadarChart();
    }, 300);

    // 渲染柱状图
    function renderBarChart() {
        var canvas = DashboardPanel.Chart.barCanvas;
        if (!canvas) return;

        var ctx = canvas.getContext('2d');

        // 如果图表已存在，先销毁
        if (DashboardPanel.Chart.barChart) {
            DashboardPanel.Chart.barChart.destroy();
        }

        // 准备数据
        var metrics = ['立直率', '副露率', '和牌率', '放铳率', '平均打点'];
        var datasets = [];

        // 获取最高段位的基准
        var highestBaseline = DEFAULT_BASELINE;
        DashboardState.compareList.forEach(function(player) {
            if (player.level && player.level.id) {
                var playerBaseline = getBaseline(player.level.id);
                if (playerBaseline && playerBaseline.立直率 < highestBaseline.立直率) {
                    highestBaseline = playerBaseline;
                }
            }
        });

        // 为每个玩家创建数据集
        DashboardState.compareList.forEach(function(player, index) {
            if (!player.extendedStats || player.extendedStats.count < 50) {
                return;
            }

            var stats = player.extendedStats;
            var baseline = getBaseline(player.level ? player.level.id : null);
            var color = PLAYER_COLORS[index];

            // 计算偏差并设置颜色
            var data = [
                stats.立直率 || 0,
                stats.副露率 || 0,
                stats.和牌率 || 0,
                stats.放铳率 || 0,
                stats.平均打点 || 0
            ];

            var backgroundColor = data.map(function(value, i) {
                var baselineValue = i === 4 ? baseline.平均打点 : baseline[metrics[i]];
                var deviation = value - baselineValue;
                var threshold = i === 4 ? 200 : 2; // 平均打点阈值更大

                if (Math.abs(deviation) < threshold) {
                    return 'rgba(150, 150, 150, 0.6)'; // 灰色
                } else if (deviation > threshold * 2) {
                    return 'rgba(255, 99, 132, 0.8)'; // 深红
                } else if (deviation > threshold) {
                    return 'rgba(255, 99, 132, 0.5)'; // 中红
                } else if (deviation < -threshold * 2) {
                    return 'rgba(75, 192, 192, 0.8)'; // 深绿
                } else {
                    return 'rgba(75, 192, 192, 0.5)'; // 中绿
                }
            });

            datasets.push({
                label: player.nickname,
                data: data,
                backgroundColor: backgroundColor,
                borderColor: color.border,
                borderWidth: 1
            });
        });

        // 检查是否有有效数据
        if (datasets.length === 0) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#888';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('暂无数据，请添加玩家到对比列表', canvas.width / 2, canvas.height / 2);
            return;
        }

        // 创建图表
        DashboardPanel.Chart.barChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: metrics,
                datasets: datasets
            },
            options: {
                indexAxis: 'y', // 横向柱状图
                responsive: true,
                maintainAspectRatio: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            color: '#888',
                            callback: function(value) {
                                return value;
                            }
                        },
                        grid: {
                            color: 'rgba(255, 215, 0, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#ffd700',
                            font: {
                                size: 12
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: '#fff',
                            padding: 10,
                            font: {
                                size: 12
                            }
                        },
                        onClick: function(e, legendItem, legend) {
                            var index = legendItem.datasetIndex;
                            var chart = legend.chart;
                            var meta = chart.getDatasetMeta(index);
                            meta.hidden = !meta.hidden;
                            chart.update('none');
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffd700',
                        bodyColor: '#fff',
                        borderColor: '#ffd700',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function(context) {
                                var label = context.dataset.label || '';
                                var value = context.parsed.x;
                                var metric = context.label;

                                // 格式化值
                                var formattedValue = metric === '平均打点'
                                    ? Math.round(value) + '点'
                                    : value.toFixed(1) + '%';

                                // 计算偏差
                                var playerIndex = context.datasetIndex;
                                var player = DashboardState.compareList[playerIndex];
                                if (player) {
                                    var baseline = getBaseline(player.level ? player.level.id : null);
                                    var baselineValue = metric === '平均打点' ? baseline.平均打点 : baseline[metric];
                                    var deviation = value - baselineValue;
                                    var deviationStr = (deviation >= 0 ? '+' : '') +
                                        (metric === '平均打点' ? Math.round(deviation) : deviation.toFixed(1)) +
                                        (metric === '平均打点' ? '点' : '%');

                                    return label + ': ' + formattedValue + ' (' + deviationStr + ')';
                                }

                                return label + ': ' + formattedValue;
                            }
                        }
                    }
                },
                animation: false
            }
        });

        console.log('[面板Pro] 柱状图渲染完成');
    }

    // 更新柱状图（防抖版本）
    var updateBarChartDebounced = debounce(function() {
        renderBarChart();
    }, 300);

    // Tab 切换功能
    function initTabNavigation() {
        var tabNav = DashboardPanel.Chart.tabNav;
        if (!tabNav) return;

        var tabs = tabNav.querySelectorAll('.panel-tab');
        var radarCanvas = DashboardPanel.Chart.radarCanvas;
        var barCanvas = DashboardPanel.Chart.barCanvas;
        var detailsTable = DashboardPanel.Chart.detailsTable;

        tabs.forEach(function(tab) {
            tab.addEventListener('click', function() {
                var tabIndex = parseInt(tab.dataset.tab);

                // 更新 tab 样式
                tabs.forEach(function(t) {
                    t.style.background = 'rgba(255, 215, 0, 0.2)';
                    t.style.color = '#ffd700';
                    t.style.fontWeight = 'normal';
                });

                tab.style.background = '#ffd700';
                tab.style.color = '#000';
                tab.style.fontWeight = 'bold';

                // 切换显示内容
                radarCanvas.style.display = 'none';
                barCanvas.style.display = 'none';
                detailsTable.style.display = 'none';

                if (tabIndex === 0) {
                    radarCanvas.style.display = 'block';
                    if (!DashboardPanel.Chart.radarChart) {
                        renderRadarChart();
                    }
                } else if (tabIndex === 1) {
                    barCanvas.style.display = 'block';
                    if (!DashboardPanel.Chart.barChart) {
                        renderBarChart();
                    }
                } else if (tabIndex === 2) {
                    detailsTable.style.display = 'block';
                    renderDetailsTable();
                }
            });
        });
    }

    // 渲染详细数据表格（简化版）
    function renderDetailsTable() {
        var container = DashboardPanel.Chart.detailsTable;
        if (!container) return;

        container.innerHTML = '';

        if (DashboardState.compareList.length === 0) {
            var emptyMsg = document.createElement('div');
            emptyMsg.style.cssText = 'padding: 20px; text-align: center; color: #888;';
            emptyMsg.textContent = '暂无数据';
            container.appendChild(emptyMsg);
            return;
        }

        var table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse; color: #fff;';

        // 表头
        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        headerRow.style.cssText = 'background: rgba(255, 215, 0, 0.1); border-bottom: 2px solid #ffd700;';

        var headers = ['指标', ...DashboardState.compareList.map(function(p) { return p.nickname; })];
        headers.forEach(function(h) {
            var th = document.createElement('th');
            th.textContent = h;
            th.style.cssText = 'padding: 10px; text-align: left; color: #ffd700;';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // 表体
        var tbody = document.createElement('tbody');
        var metrics = ['立直率', '副露率', '和牌率', '放铳率', '平均打点'];

        metrics.forEach(function(metric) {
            var row = document.createElement('tr');
            row.style.cssText = 'border-bottom: 1px solid rgba(255, 215, 0, 0.2);';

            var metricCell = document.createElement('td');
            metricCell.textContent = metric;
            metricCell.style.cssText = 'padding: 10px; font-weight: bold;';
            row.appendChild(metricCell);

            DashboardState.compareList.forEach(function(player) {
                var cell = document.createElement('td');
                cell.style.cssText = 'padding: 10px;';

                if (player.extendedStats && player.extendedStats.count >= 50) {
                    var value = player.extendedStats[metric];
                    if (value !== undefined) {
                        cell.textContent = metric === '平均打点'
                            ? Math.round(value)
                            : value.toFixed(1) + '%';
                    } else {
                        cell.textContent = '-';
                    }
                } else {
                    cell.textContent = '数据不足';
                    cell.style.color = '#888';
                }

                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        container.appendChild(table);
    }

    // 初始化图表模块
    function initChartModule() {
        // 监听玩家添加/移除事件
        EventBus.on('player:added', function() {
            updateRadarChartDebounced();
            updateBarChartDebounced();
        });

        EventBus.on('player:removed', function() {
            updateRadarChartDebounced();
            updateBarChartDebounced();
        });

        EventBus.on('data:refreshed', function() {
            renderRadarChart();
            renderBarChart();
            renderDetailsTable();
        });

        // 监听面板调整大小
        EventBus.on('panel:resized', function() {
            if (DashboardPanel.Chart.radarChart) {
                DashboardPanel.Chart.radarChart.resize();
            }
            if (DashboardPanel.Chart.barChart) {
                DashboardPanel.Chart.barChart.resize();
            }
        });

        // 初始化 Tab 导航
        initTabNavigation();

        // 初始渲染
        renderRadarChart();
    }

    // ==================== 初始化 ====================

    console.log('[面板Pro] 脚本加载中...');
    console.log('[面板Pro] 等待 Chart.js 加载...');

    waitForChartJs(function() {
        console.log('[面板Pro] Chart.js 加载成功');

        // 创建 UI
        createPanel();
        createFloatingButton();

        // 初始化功能
        initDragging();
        initResizing();
        initMinMaxButtons();
        initKeyboardShortcuts();
        initSearchModule();
        initChartModule();

        console.log('[面板Pro] 初始化完成，按 Ctrl+Shift+D 打开面板');
    });

})();
