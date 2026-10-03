const mineflayer = require('mineflayer');
const express = require('express');
const dns = require('dns');

// Render / Bulut sunucularda IPv6 zaman aşımı (ETIMEDOUT) hatasını önlemek için IPv4 zorlaması
dns.setDefaultResultOrder('ipv4first');

const app = express();
const PORT = process.env.PORT || 10000;

let isConnected = false;
let lastError = 'Henüz bağlantı denenmedi.';

app.get('/', (req, res) => {
    if (isConnected) {
        res.send('✅ Node.js açık ve Mineflayer botu Minecraft sunucusuna BAĞLI!');
    } else {
        res.send(`⚠️ Node.js açık AMA bot henüz giremedi. Son Durum/Hata: ${lastError}`);
    }
});

app.listen(PORT, () => {
    console.log(`Web server ${PORT} portunda çalışıyor.`);
});

let bot = null;
let afkInterval = null;

function createBot() {
    console.log('Minecraft sunucusuna bağlanılıyor...');
    lastError = 'Bağlanılıyor...';

    // 1. ESKİ BOT VE ZAMANLAYICILARI TEMİZLE
    if (bot) {
        bot.removeAllListeners();
        bot = null;
    }
    if (afkInterval) {
        clearInterval(afkInterval);
        afkInterval = null;
    }

    // 2. BOT OLUŞTUR
    bot = mineflayer.createBot({
        host: 'BuYason-s5R0.aternos.me',
        port: 45830,
        username: process.env.MC_USERNAME || 'Bot_Test',
        version: "1.21.1",
        auth: 'offline',
        checkTimeoutInterval: 90 * 1000,
        hideErrors: false
    });

    // TCP seviyesinde soket bağlantısını izle
    if (bot._client) {
        bot._client.on('connect', () => {
            console.log('🌐 TCP Bağlantısı kuruldu, paketler Aternos sunucusuna iletiliyor...');
        });
    }

    bot.once('spawn', () => {
        isConnected = true;
        lastError = 'Yok (Sunucuda aktif)';
        console.log('✅ Bot Minecraft sunucusuna başarıyla bağlandı ve oyunda doğdu!');

        // ANTI-AFK (Her 60 saniyede bir zıplama)
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
        const kickMsg = typeof reason === 'object' ? JSON.stringify(reason) : reason;
        lastError = `Sunucudan atıldı: ${kickMsg}`;
        console.log('🚨 Bot sunucudan atıldı:', kickMsg);
    });

    bot.on('error', (err) => {
        isConnected = false;
        lastError = err.message || err;
        console.log('❌ Bot hatası:', lastError);
    });

    bot.on('end', (reason) => {
        isConnected = false;
        console.log(`🔄 Bağlantı kesildi (${reason || 'Bilinmeyen neden'}). 15 saniye sonra tekrar bağlanılacak...`);

        if (afkInterval) clearInterval(afkInterval);

        setTimeout(() => {
            createBot();
        }, 15000);
    });
}

// GLOBAL HATA YAKALAYICILAR
process.on('uncaughtException', (err) => {
    console.error('Yakalanamayan Hata:', err.message);
});

process.on('unhandledRejection', (reason) => {
    console.error('İşlenmeyen Vaat Reddi:', reason);
});

createBot();
