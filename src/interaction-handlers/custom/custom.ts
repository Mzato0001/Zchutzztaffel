import { CacheType, Collection, Interaction, MessageEmbed } from 'discord.js';

import { InteractionHandler } from '@sapphire/framework';

import { EMOJIS } from '../../lib/constants';

import type { SummonerLeagueDto } from 'twisted/dist/models-dto';

export class CustomInteractionHandler extends InteractionHandler {
	public run(_interaction: Interaction<CacheType>, _parsedData?: unknown): unknown {
		throw new Error('Method not implemented.');
	}

	public generateEmbed(summoners: SummonerLeagueDto[], index = 0) {
		const summonerScores = new Collection<string, number>();
		summoners.forEach((summoner) => summonerScores.set(summoner.summonerName, this.tierScore(summoner.tier, summoner.rank)));
		const leftTeamIndex = this.meetInTheMiddle(
			summonerScores.map((score) => score),
			index
		);
		const leftTeam = summoners.filter((_summoner, index) => leftTeamIndex.includes(index));
		const rightTeam = summoners.filter((_summoner, index) => !leftTeamIndex.includes(index));
		const embed = new MessageEmbed()
			.setTitle('カスタムチーム分け')
			.setColor('RED')
			.addFields([
				{
					name: `左チーム: ${summonerScores
						.filter((_val, name) => Boolean(leftTeam.find((s) => s.summonerName === name)))
						.reduce((c, d) => c + d, 0)}点`,
					value: leftTeam
						.map(
							(summoner) =>
								`**${summoner.summonerName}** <:a:${EMOJIS.RANKS[summoner.tier as 'IRON']}> ${summoner.tier} ${summoner.rank}`
						)
						.join('\n'),
					inline: true
				},
				{
					name: `右チーム: ${summonerScores
						.filter((_val, name) => Boolean(rightTeam.find((s) => s.summonerName === name)))
						.reduce((c, d) => c + d, 0)}点`,
					value: rightTeam
						.map(
							(summoner) =>
								`**${summoner.summonerName}** <:a:${EMOJIS.RANKS[summoner.tier as 'IRON']}> ${summoner.tier} ${summoner.rank}`
						)
						.join('\n'),
					inline: true
				}
			]);
		return embed;
	}

	public tierScore(tier: string, rank: string) {
		let score = 0;
		switch (rank.toUpperCase()) {
			case 'I':
				score = 3;
				break;
			case 'II':
				score = 2;
				break;
			case 'III':
				score = 1;
				break;
			case 'IV':
				score = 0;
				break;
			default:
				score = -1;
		}
		switch (tier.toUpperCase()) {
			case 'BRONZE':
				score += 4;
				break;
			case 'SILVER':
				score += 4 * 2;
				break;
			case 'GOLD':
				score += 4 * 3;
				break;
			case 'PLATINUM':
				score += 4 * 4;
				break;
			case 'DIAMOND':
				score += 4 * 5;
				break;
			case 'MASTER':
				score += 4 * 6;
				break;
			case 'GRANDMASTER':
				score += 4 * 7;
				break;
			case 'CHALLENGER':
				score += 4 * 8;
				break;
			default:
				score += -1;
		}
		return score;
	}

	public meetInTheMiddle(array: number[], index = 0) {
		const sum = array.reduce((a, b) => a + b, 0);
		let lefts: number[][] = [];
		const temp: number[] = new Array(5);
		while (!lefts.length) {
			combinationUtil(array, temp, 0, array.length - 1, 0, 5);
		}
		lefts = lefts
			.filter((arr) => Math.abs(arr.reduce((c, d) => c + d, 0) - sum / 2) < 5)
			.sort((a, b) => Math.abs(a.reduce((c, d) => c + d, 0) - sum / 2) - Math.abs(b.reduce((c, d) => c + d, 0) - sum / 2))
			.map((arr) => arr.sort((a, b) => b - a));

		const uniqueLefts: number[][] = [];
		lefts.forEach((_, i) => {
			if (uniqueLefts.every((arr) => !arr.every((a, b) => a === lefts[i][b]))) {
				uniqueLefts.push(lefts[i]);
			}
		});

		const leftTeamIndex = new Array(0);
		return uniqueLefts[index].map((num) => {
			if (!leftTeamIndex.includes(array.indexOf(num))) {
				leftTeamIndex.push(array.indexOf(num));
				return array.indexOf(num);
			}
			const ind = array.findIndex((n, i) => n === num && !leftTeamIndex.includes(i));
			leftTeamIndex.push(ind);
			return ind;
		});

		function combinationUtil(arr: number[], data: number[], start: number, end: number, index: number, r: number) {
			if (index === r) {
				const temp = [...data];
				temp.length = 5;
				lefts.push(temp);
			}
			for (let i = start; i <= end && end - i + 1 >= r - index; i++) {
				data[index] = arr[i];
				combinationUtil(arr, data, i + 1, end, index + 1, r);
			}
		}
	}
}
