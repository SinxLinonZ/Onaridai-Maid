const fs = require('node:fs');
const path = require('node:path');
const Database = require('better-sqlite3');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Room database initialization
const appDir = path.dirname(require.main.filename);
if (!fs.existsSync(appDir + '/db/rooms.db')) {
    fs.mkdirSync(appDir + '/db');
    fs.writeFileSync(appDir + '/db/rooms.db', '');

    const roomDB = new Database(appDir + '/db/rooms.db');
    roomDB.prepare(
        'CREATE TABLE rooms ( \
            id INTEGER PRIMARY KEY AUTOINCREMENT, \
            name TEXT, \
            owner TEXT, \
            type TEXT, \
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP)')
        .run();
    roomDB.close();
}

// Command initialization
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Event initialization
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Start bot
client.login(token);