// GM_xmlhttpRequest 封装为 Promise 接口
export function gmRequest(options) {
    return new Promise(function(resolve, reject) {
        GM_xmlhttpRequest({
            method: options.method || 'GET',
            url: options.url,
            timeout: options.timeout || 10000,
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
            onerror: function() {
                reject('网络错误');
            },
            ontimeout: function() {
                reject('请求超时');
            }
        });
    });
}
