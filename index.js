const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// UptimeRobot servisi buraya ping atarak botu 7/24 aktif tutar
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
        host: 'BuYason-s5RO.aternos.me', // Aternos Sunucu IP Adresi
        port: Number(process.env.MC_PORT) || 25565,
        username: process.env.MC_USERNAME || 'Bot',
        version: process.env.MC_VERSION || '1.21.1',
        auth: 'offline' // Aternos/Cracked sunucular için
    });

    bot.once('spawn', () => {
        console.log('✅ Bot sunucuya bağlandı!');

        // Anti-AFK: Sunucudan atılmamak için her 60 saniyede bir zıplar
        setInterval(() => {
            if (bot && bot.entity) {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            }
        }, 60000);
    });

    // 💀 Bot öldüğünde otomatik yeniden doğar (Respawn)
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
        console.log('🔄 Bağlantı kesildi. 10 saniye sonra tekrar bağlanılacak...');

        setTimeout(() => {
            createBot();
        }, 10000);
    });
}

createBot();
