const fs = require('fs');
const path = require('path');
const config = require('../config.json');

const AVATAR_DIR = path.join(__dirname, '../avatars');
let avatarFiles = [];
let currentAvatarIndex = 0;
let timer = null;

function loadAvatars() {
    try {
        if (!fs.existsSync(AVATAR_DIR)) {
            fs.mkdirSync(AVATAR_DIR);
            console.log('Avatars: Created avatars directory');
            return;
        }

        const files = fs.readdirSync(AVATAR_DIR);
        avatarFiles = files.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));

        // shuffle 
        for (let i = avatarFiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [avatarFiles[i], avatarFiles[j]] = [avatarFiles[j], avatarFiles[i]];
        }

        console.log(`Avatars: Loaded ${avatarFiles.length} avatars`);
        currentAvatarIndex = 0; // Reset index on reload
    } catch (err) {
        console.error('Avatars: Error loading avatars:', err);
    }
}

function rotateAvatar(client) {
    if (avatarFiles.length === 0) return;

    const avatarFile = avatarFiles[currentAvatarIndex];
    const avatarPath = path.join(AVATAR_DIR, avatarFile);

    try {
        client.user.setAvatar(avatarPath);
        console.log(`Avatars: Changed avatar to ${avatarFile}`);
    } catch (err) {
        console.error(`Avatars: Failed to set avatar to ${avatarFile}:`, err);
    }

    currentAvatarIndex = (currentAvatarIndex + 1) % avatarFiles.length;
}

function init(client) {
    loadAvatars();

    // Watch for changes in the avatars directory
    let fsWait = null;
    fs.watch(AVATAR_DIR, (eventType, filename) => {
        if (filename) {
            if (fsWait) clearTimeout(fsWait);
            fsWait = setTimeout(() => {
                console.log(`Avatars: Detected change in avatars directory`);
                loadAvatars();
            }, 1000);
        }
    });

    const intervalMinutes = config.avatarInterval || 15;
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`Avatars: Starting avatar rotation every ${intervalMinutes} minutes`);

    // Initial rotation
    rotateAvatar(client);

    // make it wait every interval before rotating
    timer = setInterval(() => rotateAvatar(client), intervalMs);
}

module.exports = { init };
