const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

// Code for bot:

const { token } = require('./config.json');
const { default: axios } = require('axios');

const client = new Client({intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandsFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandsFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        // Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`There is no command named: ${interaction.commandName}`);
        return;
    }
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
    }
});

// Code for the actual MC Server Stuff:

const { error, time } = require('node:console');
const ipAddress = 'hellenicraft.mine.nu';
const { voice1Id } = require('./config.json')
const { voice2Id } = require('./config.json');
const { start } = require('node:repl');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function changeChannelText(channelId, text) {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.error(`Channel with ID ${channelId} not found.`);
            return;
        }
        await channel.setName(text);
        console.log(`Channel ${channelId} renamed to ${text}`);
    } catch (error) {
        console.error('Error while changing channel text:', error);
    }
}

async function updateStatus() {
    axios.get(`https://api.mcstatus.io/v2/status/java/${ipAddress}`)
    .then(response => {
        const data = response.data;
        if (data.online) {
            console.log('Server is online');
            console.log('MOTD:', data.motd.clean);
            console.log('Players online:', data.players.online);
            console.log('Max players:', data.players.max);
            changeChannelText(voice1Id, 'Status: Online');
            changeChannelText(voice2Id, `Players: ${data.players.online}/16`);
        } else {
            console.log('Server is offline');
            changeChannelText(voice1Id, 'Status: Offline');
            changeChannelText(voice2Id, 'Players: 0/16');

        }
    })
    .catch(error => {
        console.error('Error: ',error);
    })
}

// Initialization:
client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    console.log(`voice1Id: ${voice1Id}`); // for debugging
    console.log(`voice2Id: ${voice2Id}`); // for debugging
    await startService();
});

async function startService() {
    while (true) {
        console.log("Updating Status..")
        updateStatus(); 
        await sleep(300000); // 5 lepta (se ms) gia na mhn fame rate limit :))
    }
}

client.login(token);