# Onaridai-Maid
This is a private discord bot for 2023 master's students in Tokyo University of Information Sciences.

## Administration & Maintenance
The bot instance is running on a VPS host, managing by H-kys/SinxLinonZ/Ziyi.Lin/Zion.Lin.

## Requirements / Libraries
- [Discord.js](https://discord.js.org/)
- [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)

## Structure
```
|- src
   |- commands
   |  |- <command-category>
   |  |  |- <command>.js
   |  |- <command-category>
   |     |- <command>.js
   |- db
   |  |- <category>.db
   |- events
   |  |- <event>.js
   |
   |- config.json
   |- index.js
   |- deploy-command.js
```
`config.json` : The configuration file for the bot. Copy from `config.json.example` and fill in the token and other information.

`commands` folder contains all command implementations. Each command is a separate file, and the file name should be the command name. Reference `ping.js` for the basic structure of a command. Check the `Discord.js` [documentation](https://old.discordjs.dev/#/docs/discord.js/main/general/welcome) for more information.

`events` folder contains all event implementations. Details are the same as `commands` folder.

All on server data storage should be stored in `db` folder.

`deploy-commands.js` regists all commands implemented in `commands` folder to the Discord server. Should be run after adding, removing or modifying commands.

`index.js` is the entry point of the bot.


## Contribution / Development
### Preparation
Node.JS and NPM are required for development. Node.JS version 20 and above is recommended.

### Project setup
Clone the repository to your local machine.
```
git clone https://github.com/SinxLinonZ/Onaridai-Maid.git
```

Copy `config.json.example` to `config.json` and fill in the token and other information. You may need to create a bot application in Discord Developer Portal and invite it to your own server for testing.

### Install dependencies
```
npm install
or
yarn
```
### Run the bot
```
npm run start
or
yarn run start
```