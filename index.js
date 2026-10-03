
const mineflayer = require('mineflayer');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// UptimeRobot burayı kontrol edecek
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
        host: 'BuYason-s5RO.aternos.me', // Buraya bağlanacağınız sunucu IP'sini yazın
        port: Number(process.env.MC_PORT) || 25565,
        username: process.env.MC_USERNAME || 'BotYasin',
        version: process.env.MC_VERSION || '1.21.1'
    });

    bot.once('spawn', () => {
        console.log('✅ Bot sunucuya bağlandı!');
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
