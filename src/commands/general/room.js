const { SlashCommandBuilder, ChannelType } = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('room')
        .setDescription('Self room service')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('create a room')
                .addStringOption(option =>
                    option.setName('roomname')
                        .setDescription('The name of the room to create')
                        .setRequired(true),
                )
                .addBooleanOption(option =>
                    option.setName('with-text-channel')
                        .setDescription('Whether to create a text channel')
                        .setRequired(false),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('delete a room')
                .addIntegerOption(option =>
                    option.setName('roomid')
                        .setDescription('The id of the room to delete')
                        .setRequired(true),
                ),
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        let reply = '';

        const subCmd = interaction.options.getSubcommand();
        const user = interaction.user;

        if (subCmd === 'create') {
            // Connect to database
            const appDir = path.dirname(require.main.filename);
            const roomDB = new Database(appDir + '/db/rooms.db');

            // Get command options
            let roomname;
            let withTextChannel;
            try {
                roomname = interaction.options.getString('roomname', true).toLowerCase().trim().replace(/ /g, '-');
                withTextChannel = interaction.options.getBoolean('with-text-channel', false) || false;
            }
            catch (error) {
                console.log(error);
                reply += 'Invalid input\r\n';
                await interaction.editReply(reply);
                return;
            }

            // Check if room already exists
            const voiceRoom = roomDB.prepare(
                'SELECT * FROM rooms \
                WHERE name = ? \
                and owner = ? \
                and type = ?').all(roomname, user.id, 'voice');
            const textRoom = roomDB.prepare(
                'SELECT * FROM rooms \
                WHERE name = ? \
                and owner = ? \
                and type = ?').all(roomname, user.id, 'text');

            const isVoiceRoomCreated = voiceRoom.length > 0;
            const isTextRoomCreated = textRoom.length > 0;
            if (isVoiceRoomCreated) {
                reply += `You already have a voice room named ${roomname}\r\n`;
            }
            if (withTextChannel && isTextRoomCreated) {
                reply += `You already have a text room named ${roomname}\r\n`;
            }

            // Prepare category data
            const channelCategoryText = `${interaction.member.displayName}'s region`;
            let hasCategory = interaction.guild.channels.cache.filter(
                channel => channel.name === channelCategoryText,
            ).size > 0;

            // Voice channel creation
            if (!isVoiceRoomCreated) {
                let category;
                // Create category first if not exists
                if (hasCategory) {
                    category = interaction.guild.channels.cache.find(
                        channel => channel.name === channelCategoryText,
                    );
                }
                else {
                    category = await interaction.guild.channels.create({
                        name: channelCategoryText,
                        type: ChannelType.GuildCategory,
                        // https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/RawOverwriteData
                        // permissionOverwrites: [
                        //     {
                        //         id: interaction.guild.roles.everyone,
                        //         deny: ['VIEW_CHANNEL'],
                        //     },
                        // ],
                    });
                    hasCategory = true;
                }

                // Update database
                roomDB.prepare(
                    'INSERT INTO rooms (name, owner, type) \
                    VALUES (?, ?, ?)').run(roomname, user.id, 'voice');
                // Get room id
                const roomId = roomDB.prepare(
                    'SELECT id FROM rooms \
                        WHERE name = ? \
                        and owner = ? \
                        and type = ?').get(roomname, user.id, 'voice').id;

                // Create voice channel
                const voiceChannel = await interaction.guild.channels.create({
                    name: `【${roomId}】${roomname}`,
                    type: ChannelType.GuildVoice,
                });
                // Move voice channel to target category
                await voiceChannel.setParent(category.id);
                reply += `Voice room ${roomname} created\r\n`;
            }

            // Text channel creation
            if (withTextChannel && !isTextRoomCreated) {
                let category;
                // Create category first if not exists
                if (hasCategory) {
                    category = interaction.guild.channels.cache.find(
                        channel => channel.name === channelCategoryText,
                    );
                }
                else {
                    category = await interaction.guild.channels.create({
                        name: channelCategoryText,
                        type: ChannelType.GuildCategory,
                        // https://old.discordjs.dev/#/docs/discord.js/14.11.0/typedef/RawOverwriteData
                        // permissionOverwrites: [
                        //     {
                        //         id: interaction.guild.roles.everyone,
                        //         deny: ['VIEW_CHANNEL'],
                        //     },
                        // ],
                    });
                    hasCategory = true;
                }

                // Update database
                roomDB.prepare(
                    'INSERT INTO rooms (name, owner, type) \
                    VALUES (?, ?, ?)').run(roomname, user.id, 'text');
                // Get room id
                const roomId = roomDB.prepare(
                    'SELECT id FROM rooms \
                        WHERE name = ? \
                        and owner = ? \
                        and type = ?').get(roomname, user.id, 'text').id;

                // Create text channel
                const textChannel = await interaction.guild.channels.create({
                    name: `【${roomId}】${roomname}`,
                    type: ChannelType.GuildText,
                });
                await textChannel.setParent(category.id);
                reply += `Text room ${roomname} created\r\n`;
            }

            // Reply with result
            await interaction.editReply(reply);
            roomDB.close();
        }

        else if (subCmd === 'delete') {
            // Get command options
            let deleteRoomId;
            try {
                deleteRoomId = interaction.options.getInteger('roomid', true);
            }
            catch (error) {
                console.log(error);
                reply += 'Invalid input\r\n';
                await interaction.editReply(reply);
                return;
            }

            // Connect to database
            const appDir = path.dirname(require.main.filename);
            const roomDB = new Database(appDir + '/db/rooms.db');

            // Check if room exists
            const roomData = roomDB.prepare(
                'SELECT * FROM rooms \
                WHERE id = ?').all(deleteRoomId);

            if (roomData.length === 0) {
                reply += `Room ${deleteRoomId} not found\r\n`;
            }
            else if (roomData[0].owner !== user.id) {
                reply += `You are not the owner of room ${deleteRoomId}\r\n`;
            }

            // Abort if is invalid operation
            if (reply.length > 0) {
                await interaction.editReply(reply);
                return;
            }

            // Get target channel
            const room = interaction.guild.channels.cache.find(
                channel => channel.name === `【${deleteRoomId}】${roomData[0].name}`,
            );
            if (!room) {
                reply += `Room ${deleteRoomId} not found\r\n`;
                await interaction.editReply(reply);
                return;
            }

            // Update database
            roomDB.prepare(
                'DELETE FROM rooms \
                WHERE id = ?').run(deleteRoomId);

            // Delete channel
            await room.delete();

            // Remove category if no more rooms
            const channelCategoryText = `${interaction.member.displayName}'s region`;
            const channelCategory = interaction.guild.channels.cache.find(
                channel => channel.name === channelCategoryText,
            );
            const roomsInCategory = interaction.guild.channels.cache.filter(
                channel => channel.parentId === channelCategory.id,
            );
            if (roomsInCategory.size === 0) {
                await channelCategory.delete();
                reply += 'Category deleted\r\n';
            }

            reply += `Room ${deleteRoomId} deleted\r\n`;
            await interaction.editReply(reply);
            roomDB.close();
        }

    },
};