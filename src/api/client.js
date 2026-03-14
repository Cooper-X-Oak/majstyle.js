// GM_xmlhttpRequest 封装为 Promise 接口（带重试）
export function gmRequest(options) {
    var maxRetries = options.retries || 2;
    var retryDelay = options.retryDelay || 1000;

    function attemptRequest(retriesLeft) {
        return new Promise(function(resolve, reject) {
            var url = options.url;
            GM_xmlhttpRequest({
                method: options.method || 'GET',
                url: url,
                timeout: options.timeout || 15000,
            onload: function(response) {
                if (response.status === 200) {
                    try {
                        resolve(JSON.parse(response.responseText));
                    } catch(e) {
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
            onerror: function() {
                reject({
                    type: 'network',
                    message: '网络错误',
                    url: url
                });
            },
            ontimeout: function() {
                var error = {
                    type: 'timeout',
                    message: '请求超时',
                    url: url
                };

                if (retriesLeft > 0) {
                    console.log('  [重试] 请求超时，' + retryDelay + 'ms 后重试 (剩余 ' + retriesLeft + ' 次)');
                    setTimeout(function() {
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
