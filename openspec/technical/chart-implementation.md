# 技术规范：图表实现

## Chart.js 集成

### CDN 引入
```javascript
// 在 Tampermonkey 脚本中动态加载
var chartScript = document.createElement('script');
chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js';
document.head.appendChild(chartScript);
```

### 雷达图配置

```javascript
var radarConfig = {
    type: 'radar',
    data: {
        labels: ['立直率', '副露率', '和牌率', '防守力', '平均打点', '进攻意愿'],
        datasets: [
            {
                label: '玩家A',
                data: [65, 59, 90, 81, 56, 55],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)'
            },
            {
                label: '段位平均',
                data: [50, 50, 50, 50, 50, 50],
                borderColor: 'rgb(200, 200, 200)',
                backgroundColor: 'rgba(200, 200, 200, 0.1)',
                borderDash: [5, 5]
            }
        ]
    },
    options: {
        scales: {
            r: {
                beginAtZero: true,
                max: 100
            }
        }
    }
};
```

### 柱状图配置

```javascript
var barConfig = {
    type: 'bar',
    data: {
        labels: ['立直率', '副露率', '和牌率', '放铳率', '平均打点'],
        datasets: [
            {
                label: '玩家A',
                data: [19.5, 35.2, 22.1, 15.3, 6800],
                backgroundColor: 'rgba(255, 99, 132, 0.5)'
            },
            {
                label: '玩家B',
                data: [18.2, 32.5, 21.8, 12.5, 6500],
                backgroundColor: 'rgba(54, 162, 235, 0.5)'
            }
        ]
    }
};
```

## 数据归一化

### 将不同量级的数据归一化到 0-100

```javascript
function normalizeData(stats, baseline) {
    return {
        立直率: (stats.立直率 / baseline.立直率) * 50,
        副露率: (stats.副露率 / baseline.副露率) * 50,
        和牌率: (stats.和牌率 / baseline.和牌率) * 50,
        防守力: (1 - stats.放铳率 / baseline.放铳率) * 50 + 50,
        平均打点: (stats.平均打点 / baseline.平均打点) * 50,
        进攻意愿: ((stats.立直率 + stats.副露率) / (baseline.立直率 + baseline.副露率)) * 50
    };
}
```

## 性能优化

### 图表更新而非重建
```javascript
function updateChart(chart, newData) {
    chart.data.datasets[0].data = newData;
    chart.update('none'); // 无动画更新，更快
}
```

### 防抖处理
```javascript
var debounce = function(func, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
};
```

## 响应式设计

```javascript
// 监听面板大小变化，重新渲染图表
var resizeObserver = new ResizeObserver(function(entries) {
    for (var i = 0; i < entries.length; i++) {
        if (chart) {
            chart.resize();
        }
    }
});
resizeObserver.observe(panelElement);
```
