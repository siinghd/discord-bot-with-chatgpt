import { Client, GatewayIntentBits } from 'discord.js';
import './deploy-commands';
import SingletonDatabase from './db';
import { getLastMessages, saveMessage } from './functions';
import { OpenAI } from 'openai';

const systemMessage =
  "I'm a helpful assistant trained to provide coding assistance. My responses are concise to stay under 1980characters. Feel free to ask your question!";
type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ConversationHistory = Message[];

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const dbInstance = SingletonDatabase.getInstance();
dbInstance.run(
  `CREATE TABLE IF NOT EXISTS interactions (
        userId TEXT,
        content TEXT,
        timestamp INTEGER,
        role TEXT
    )`
);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
  console.log('Ready!');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'helpme') {
    const userId = interaction.user.id;
    const userMessage = interaction.options.get('message')?.value as string;

    if (userMessage) {
      let conversationHistory = await getLastMessages(userId);
      conversationHistory = conversationHistory.reverse();
      console.log(conversationHistory);
      conversationHistory.push({
        role: 'user',
        content: `${userMessage}, the response must be 1980 characters or fewer in length, this is really important.`,
      });

      saveMessage(
        userId,
        `${userMessage}, Your response must be 1980 characters or fewer in length, this is really important.`,
        'user'
      );

      await interaction.deferReply();
      const conciseSystemMessage =
        'Please keep your response concise, ideally under 1980 characters.';
      const openaiResponse = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'system', content: conciseSystemMessage },
          ...conversationHistory,
        ],
        model: 'gpt-3.5-turbo',
      });
      const MAX_DISCORD_MESSAGE_LENGTH = 2000;
      const botResponse = openaiResponse.choices[0].message.content || '';
      if (botResponse.length > MAX_DISCORD_MESSAGE_LENGTH) {
        for (
          let i = 0;
          i < botResponse.length;
          i += MAX_DISCORD_MESSAGE_LENGTH
        ) {
          const chunk = botResponse.substring(
            i,
            i + MAX_DISCORD_MESSAGE_LENGTH
          );
          await interaction.followUp(chunk);
        }
      } else {
        await interaction.editReply(botResponse);
      }
      saveMessage(
        userId,
        botResponse || 'Something went wrong...',
        'assistant'
      );
    } else {
      await interaction.editReply('Please provide a message.');
    }
  }
});

// Login to Discord with your app's token
client.login(process.env.DISCORD_TOKEN);

process.on('SIGTERM', () => {
  dbInstance.close();
  process.exit(0);
});
