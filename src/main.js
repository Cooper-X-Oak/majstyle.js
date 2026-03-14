import { getPlayerDatas, getMyAccountId } from './game/game-bridge.js';
import { processPlayer } from './game/player-processor.js';
import { clearAllPlayerInfoUI, resetPlayerUICounter } from './ui/ui-manager.js';

(function() {
    'use strict';

    var lastCheck = null;

    setTimeout(function() {
        setInterval(function() {
            try {
                var playerDatas = getPlayerDatas();
                var myId = getMyAccountId();

                if (!playerDatas || playerDatas.length === 0) {
                    clearAllPlayerInfoUI();
                    return;
                }

                var currentIds = playerDatas.map(function(p) {
                    return p.account_id;
                }).sort().join(',');

                if (currentIds !== lastCheck) {
                    lastCheck = currentIds;
                    resetPlayerUICounter();

                    console.log('========================================');
                    console.log('         雀魂对手风格分析');
                    console.log('========================================');

                    var promises = [];
                    for (var i = 0; i < playerDatas.length; i++) {
                        promises.push(processPlayer(playerDatas[i], myId, i));
                    }

                    Promise.all(promises).then(function() {
                        console.log('');
                        console.log('========================================');
                    });
                }
            } catch(e) {
                console.log('[错误] ' + e.message);
                console.log(e.stack);
            }
        }, 1000);
    }, 2000);
})();
