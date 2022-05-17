import type { Snowflake } from 'discord.js';
import type { SummonerLeagueDto, SummonerV4DTO } from 'twisted/dist/models-dto';

export interface Customs {
	tid: Snowflake;
	data: SummonerLeagueDto[];
	date: Date;
}

export interface Users extends Omit<SummonerV4DTO, 'accountId' | 'revisionDate' | 'summonerLevel'> {
	uid: Snowflake;
	solo?: Partial<Pick<SummonerLeagueDto, 'tier' | 'rank'>>;
	flex?: Partial<Pick<SummonerLeagueDto, 'tier' | 'rank'>>;
	leaderSet?: Partial<Pick<SummonerLeagueDto, 'tier' | 'rank'>>;
}
