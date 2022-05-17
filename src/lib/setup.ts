// Unless explicitly defined, set NODE_ENV as development:
process.env.NODE_ENV ??= 'development';

import '@sapphire/plugin-logger/register';
import 'reflect-metadata';

import * as colorette from 'colorette';
import { config } from 'dotenv-cra';
import { join } from 'path';
import { inspect } from 'util';

import { srcDir } from './constants';

import type { Snowflake } from 'discord.js';
import type { Db } from 'mongodb';
import type { LolApi } from 'twisted';
import type { Customs, Users } from './schemas';

// Read env var
config({ path: join(srcDir, '.env') });

// Set default inspection depth
inspect.defaultOptions.depth = 1;

// Enable colorette
colorette.createColors({ useColor: true });

export interface AlpetaOptions {
	owner?: Snowflake | Snowflake[];
	token?: string;
	root: string;
}

declare module '@sapphire/framework' {
	interface SapphireClient {
		config: AlpetaOptions;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		db: Db;
		lol: LolApi;
	}
}

declare module 'mongodb' {
	interface Db {
		collection(name: 'customs', options?: CollectionOptions | undefined): Collection<Customs>;
		collection(name: 'users', options?: CollectionOptions | undefined): Collection<Users>;
	}
}
