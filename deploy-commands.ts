import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { ApplicationCommandOptionType } from 'discord.js';

const commands = [
  {
    name: 'helpme',
    description: 'Request help!',
    options: [
      {
        name: 'message',
        description: 'The message to send to the helper',
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(
        process.env.DISCORD_CLIENT_ID!
        /*  process.env.SERVER_ID_SLASH! */
      ),
      {
        body: commands,
      }
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
