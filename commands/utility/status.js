const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Server Status'),
    async execute(interaction) {
        const ipAddress = 'hellenicraft.mine.nu';
        try {
            const response = await axios.get(`https://api.mcstatus.io/v2/status/java/${ipAddress}`);
            const data = response.data;
            if (data.online) {
                const playerList = data.players.list ? data.players.list.join(', ') : 'No players online';
                interaction.reply(`Online (${data.players.online}/16). Playerlist: Query is disabed`);
            } else {
                interaction.reply('Server is Offline');
            }
        } catch (error) {
            console.error('Error: ', error);
            interaction.reply('Failed to fetch server status.');
        }
    },
};
