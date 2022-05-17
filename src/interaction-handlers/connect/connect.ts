import type { CacheType, Interaction } from 'discord.js';
import { Constants } from 'twisted';

import { InteractionHandler } from '@sapphire/framework';

export class ConnectInteractionHandler extends InteractionHandler {
	public run(_interaction: Interaction<CacheType>, _parsedData?: unknown): unknown {
		throw new Error('Method not implemented.');
	}

	public async request(name: string) {
		const summoner = await this.container.lol.Summoner.getByName(name, Constants.Regions.JAPAN).catch((err) => console.error(err));

		if (!summoner) return undefined;

		const league = await this.container.lol.League.bySummoner(summoner.response.id, Constants.Regions.JAPAN);
		return { summoner, league };
	}
}
