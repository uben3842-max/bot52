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

let bot;

function createBot() {
    console.log('Minecraft sunucusuna bağlanılıyor...');

    bot = mineflayer.createBot({
        host: 'BuYason-s5RO.aternos.me',
        port: 45830, // 👈 Aternos portunuz buraya eklendi
        username: process.env.MC_USERNAME || 'Bot',
        version: process.env.MC_VERSION || '1.21.1', // ⚠️ Aternos panelindeki sürümle tam eşleşmeli
        auth: 'offline',
        checkTimeoutInterval: 60 * 1000 // Sunucu kasılmalarında zaman aşımına düşmemesi için 60 saniye
    });

    bot.once('spawn', () => {
        console.log('✅ Bot sunucuya bağlandı!');

        // Anti-AFK
        setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
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
        setTimeout(() => {
            createBot();
        }, 15000);
    });
}

createBot();
