const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 10000;

// Tarayıcıdaki kafa karışıklığını önlemek için durumu güncelledik
let isConnected = false;

app.get('/', (req, res) => {
    if (isConnected) {
        res.send('✅ Node.js sunucusu açık ve Mineflayer botu Minecraft sunucusuna BAĞLI!');
    } else {
        res.send('⚠️ Node.js sunucusu açık AMA bot şu anda Minecraft sunucusuna BAĞLANAMADI (Aternos kapalı veya port hatalı olabilir).');
    }
});

app.listen(PORT, () => {
    console.log(`Web server ${PORT} portunda çalışıyor.`);
});

let bot = null;
let afkInterval = null;

function createBot() {
    console.log('Minecraft sunucusuna bağlanılıyor...');

    // Eski bot ve zamanlayıcıları temizle
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
    if (afkInterval) {
        clearInterval(afkInterval);
        afkInterval = null;
    }

    bot = mineflayer.createBot({
        host: 'squirrel.aternos.host',
        port: 45830,
        username: process.env.MC_USERNAME || 'Bot_Test',
        version: '1.21.1', // Sürümü açıkça belirtiyoruz
        auth: 'offline',
        checkTimeoutInterval: 90 * 1000
    });

    bot.once('spawn', () => {
        isConnected = true;
        console.log('✅ Bot Minecraft sunucusuna başarıyla bağlandı ve oyunda doğdu!');

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
        isConnected = false;
        console.log('🚨 Bot sunucudan atıldı:', JSON.stringify(reason));
    });

    bot.on('error', (err) => {
        isConnected = false;
        console.log('❌ Bot hatası:', err.message);
    });

    bot.on('end', () => {
        isConnected = false;
        console.log('🔄 Bağlantı kesildi. 15 saniye sonra tekrar bağlanılacak...');

        if (afkInterval) clearInterval(afkInterval);

        setTimeout(() => {
            createBot();
        }, 15000);
    });
}

process.on('uncaughtException', (err) => {
    console.error('Yakalanamayan Hata:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('İşlenmeyen Vaat Reddi:', reason);
});

createBot();
