const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Mineflayer bot aktif!');
});

app.listen(PORT, () => {
    console.log(`Web server ${PORT} portunda çalışıyor.`);
});

let bot = null;
let afkInterval = null;

function createBot() {
    console.log('Minecraft sunucusuna bağlanılıyor...');

    // 1. ESKİ BOT VE ZAMANLAYICILARI TEMİZLE (Bellek sızıntısını önler)
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
    if (afkInterval) {
        clearInterval(afkInterval);
        afkInterval = null;
    }

    // 2. YENİ BOT OLUŞTUR
    bot = mineflayer.createBot({
        host: 'BuYason-s5RO.aternos.me',
        port: 45830,
        username: process.env.MC_USERNAME || 'Bot',
        version: process.env.MC_VERSION || '1.21.1',
        auth: 'offline',
        checkTimeoutInterval: 60 * 1000
    });

    bot.once('spawn', () => {
        console.log('✅ Bot sunucuya bağlandı!');

        // 3. TEK BİR ANTI-AFK ZAMANLAYICISI BAŞLAT
        afkInterval = setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => {
                    if (bot) bot.setControlState('jump', false);
                }, 500);
            }
        }, 60000);
    });

    bot.on('death', () => {
        console.log('💀 Bot öldü, yeniden doğuluyor...');
        bot.respawn();
    });

    bot.on('chat', (username, message) => {
        console.log(`${username}: ${message}`);
    });

    bot.on('kicked', (reason) => {
        console.log('Bot sunucudan atıldı:', reason);
    });

    bot.on('error', (err) => {
        console.log('❌ Bot hatası:', err.message);
    });

    bot.on('end', () => {
        console.log('🔄 Bağlantı kesildi. 15 saniye sonra tekrar bağlanılacak...');

        if (afkInterval) clearInterval(afkInterval);

        setTimeout(() => {
            createBot();
        }, 15000);
    });
}

// 4. UYGULAMANIN ÇÖKMESİNİ ÖNLENEN GLOBAL HATA YAKALAYICILAR
process.on('uncaughtException', (err) => {
    console.error('Yakalanamayan Hata:', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('İşlenmeyen Vaat Reddi:', reason);
});

createBot();
