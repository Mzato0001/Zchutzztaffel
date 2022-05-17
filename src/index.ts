import './lib/setup';

import { Db, MongoClient } from 'mongodb';

import { BucketScope, SapphireClient } from '@sapphire/framework';
import { container } from '@sapphire/pieces';

import type { AlpetaOptions } from './lib/setup';
import { envParseArray, envParseString } from './lib/env-parser';
import { LolApi } from 'twisted';

export default class System extends SapphireClient {
	public config: AlpetaOptions;

	public constructor(config: AlpetaOptions, db: Db) {
		super({
			allowedMentions: { parse: ['users'], repliedUser: true },
			intents: [
				'GUILDS',
				'GUILD_MEMBERS',
				'GUILD_BANS',
				'GUILD_EMOJIS_AND_STICKERS',
				'GUILD_VOICE_STATES',
				'GUILD_MESSAGES',
				'GUILD_MESSAGE_REACTIONS',
				'DIRECT_MESSAGES',
				'DIRECT_MESSAGE_REACTIONS'
			],
			defaultPrefix: 'sw ',
			defaultCooldown: {
				delay: 1000,
				filteredCommands: [''],
				scope: BucketScope.Global,
				limit: 10
			}
		});

		this.config = config;

		container.db = db;
		container.lol = new LolApi({
			rateLimitRetry: true,
			key: envParseString('RIOT_API_KEY')
		});

		process.on('unhandledRejection', () => ({}));
	}

	public async start() {
		return this.login(this.config.token);
	}
}

void new MongoClient(process.env.MONGO_URL!).connect().then(async (mClient) => {
	const client = new System(
		{
			owner: envParseArray('OWNERS'),
			token: process.env.TOKEN!,
			root: '.'
		},
		mClient.db('Ashborn')
	);
	await client.start();
});
