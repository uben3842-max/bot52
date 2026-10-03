```js
const mineflayer = require('mineflayer');
const express = require('express');
const dns = require('dns');

// Render / Bulut sunucularda IPv4 kullan
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 10000;

let isConnected = false;
let lastError = 'Henüz bağlantı denenmedi.';

let bot = null;
let afkInterval = null;
let reconnectTimeout = null;
let isReconnecting = false;

// Web sayfası
app.get('/', (req, res) => {
    if (isConnected) {
        res.send('✅ Node.js açık ve Mineflayer botu Minecraft sunucusuna BAĞLI!');
    } else {
        res.send(
            `⚠️ Node.js açık AMA bot sunucuda değil.<br>Son Durum/Hata: ${lastError}`
        );
    }
});

app.listen(PORT, () => {
    console.log(`🌐 Web server ${PORT} portunda çalışıyor.`);
});


// ==============================
// BOT OLUŞTURMA
// ==============================

function createBot() {

    // Eğer zaten çalışan bir bot varsa tekrar oluşturma
    if (bot && isConnected) {
        console.log('⚠️ Bot zaten bağlı, yeni bağlantı oluşturulmadı.');
        return;
    }

    isReconnecting = false;

    console.log('🔌 Minecraft sunucusuna bağlanılıyor...');
    lastError = 'Minecraft sunucusuna bağlanılıyor...';

    // Eski AFK timerını temizle
    if (afkInterval) {
        clearInterval(afkInterval);
        afkInterval = null;
    }

    // Eski reconnect timerını temizle
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }

    // Eski botu temizle
    if (bot) {
        try {
            bot.removeAllListeners();
            bot.end();
        } catch (err) {
            console.log('Eski bot temizlenirken hata:', err.message);
        }

        bot = null;
    }

    // ==============================
    // MINEFLAYER BOT
    // ==============================

    bot = mineflayer.createBot({
        host: 'BuYason-s5R0.aternos.me',
        port: 45830,

        username: process.env.MC_USERNAME || 'Bot_Test',

        version: '1.21.1',

        auth: 'offline',

        checkTimeoutInterval: 90 * 1000,

        hideErrors: false,

        // Buradaki virgül önemli!
        skipValidation: true
    });


    // ==============================
    // TCP BAĞLANTISI
    // ==============================

    if (bot._client) {

        bot._client.on('connect', () => {
            console.log('🌐 TCP bağlantısı kuruldu.');
        });

    }


    // ==============================
    // BOT SPAWN
    // ==============================

    bot.once('spawn', () => {

        isConnected = true;
        isReconnecting = false;

        lastError = 'Yok (Sunucuda aktif)';

        console.log('=================================');
        console.log('✅ BOT SUNUCUYA GİRDİ!');
        console.log('👤 Kullanıcı:', bot.username);
        console.log('🌍 Sunucu:', 'BuYason-s5R0.aternos.me:45830');
        console.log('=================================');


        // ==============================
        // ANTI-AFK
        // ==============================

        if (afkInterval) {
            clearInterval(afkInterval);
        }

        afkInterval = setInterval(() => {

            if (bot && bot.entity && isConnected) {

                console.log('🦘 Anti-AFK hareketi yapılıyor...');

                bot.setControlState('jump', true);

                setTimeout(() => {

                    if (bot && bot.entity) {
                        bot.setControlState('jump', false);
                    }

                }, 500);

            }

        }, 60000);

    });


    // ==============================
    // ÖLÜM
    // ==============================

    bot.on('death', () => {

        console.log('💀 Bot öldü.');

        setTimeout(() => {

            if (bot && bot.entity) {
                console.log('🔄 Bot yeniden doğuyor...');
                bot.respawn();
            }

        }, 1000);

    });


    // ==============================
    // CHAT
    // ==============================

    bot.on('chat', (username, message) => {

        console.log(`💬 ${username}: ${message}`);

    });


    // ==============================
    // KICK
    // ==============================

    bot.on('kicked', (reason) => {

        isConnected = false;

        let kickMsg;

        try {
            kickMsg =
                typeof reason === 'object'
                    ? JSON.stringify(reason)
                    : String(reason);
        } catch {
            kickMsg = String(reason);
        }

        lastError = `Sunucudan atıldı: ${kickMsg}`;

        console.log('🚨 BOT SUNUCUDAN ATILDI!');
        console.log('Sebep:', kickMsg);

    });


    // ==============================
    // ERROR
    // ==============================

    bot.on('error', (err) => {

        isConnected = false;

        lastError = err.message || String(err);

        console.log('❌ Mineflayer hatası:', lastError);

    });


    // ==============================
    // BAĞLANTI KOPTU
    // ==============================

    bot.on('end', (reason) => {

        isConnected = false;

        console.log('=================================');
        console.log('🔴 MINECRAFT BAĞLANTISI KOPTU!');
        console.log('Sebep:', reason || 'Bilinmeyen neden');
        console.log('=================================');


        // Anti-AFK'yi durdur
        if (afkInterval) {

            clearInterval(afkInterval);
            afkInterval = null;

        }


        // Eğer zaten yeniden bağlanma süreci varsa
        if (isReconnecting) {
            return;
        }

        isReconnecting = true;

        lastError = 'Bağlantı koptu. 15 saniye sonra tekrar bağlanılacak...';

        console.log(
            '🔄 15 saniye sonra Minecraft sunucusuna tekrar bağlanılacak...'
        );


        // 15 saniye sonra yeniden bağlan
        reconnectTimeout = setTimeout(() => {

            reconnectTimeout = null;

            console.log('🔄 Yeniden bağlantı deneniyor...');

            createBot();

        }, 15000);

    });

}


// ==============================
// GLOBAL HATA YAKALAYICILAR
// ==============================

process.on('uncaughtException', (err) => {

    console.error('🚨 Yakalanamayan hata:', err);

});


process.on('unhandledRejection', (reason) => {

    console.error('🚨 İşlenmeyen Promise hatası:', reason);

});


// ==============================
// BOTU BAŞLAT
// ==============================

console.log('🚀 Mineflayer bot başlatılıyor...');

createBot();
```
