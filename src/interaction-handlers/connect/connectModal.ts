import { MessageEmbed, ModalSubmitInteraction } from 'discord.js';

import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';

import { EMOJIS } from '../../lib/constants';
import { ConnectInteractionHandler } from './connect';
import type { CustomInteractionHandler } from '../custom/custom';
import { Constants } from 'twisted';
import { isNullishOrEmpty } from '@sapphire/utilities';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ButtonInteractionHandler extends ConnectInteractionHandler {
	public override async parse(interaction: ModalSubmitInteraction) {
		if (!interaction.customId.startsWith('connectModal')) return this.none();
		await interaction.deferReply({ ephemeral: true });
		if (
			!isNullishOrEmpty(interaction.fields.getTextInputValue('connectRank')) &&
			!isNullishOrEmpty(interaction.fields.getTextInputValue('connectDivision')) &&
			(this.container.stores.get('interaction-handlers').get('custom') as CustomInteractionHandler).tierScore(
				interaction.fields.getTextInputValue('connectRank'),
				interaction.fields.getTextInputValue('connectDivision')
			) < 0
		) {
			await interaction.editReply('ランクかティアが無効。');
			return this.none();
		}
		return this.some({
			name: interaction.fields.getTextInputValue('connectName'),
			tier: interaction.fields.getTextInputValue('connectRank').toUpperCase(),
			rank: interaction.fields.getTextInputValue('connectDivision').toUpperCase(),
			uid: interaction.customId.split(':')[1]
		});
	}

	public override async run(interaction: ModalSubmitInteraction, { name, rank, tier, uid }: InteractionHandler.ParseResult<this>) {
		const data = await this.request(name);

		if (!data) {
			await interaction.editReply('Leagueアカウントが見つかりませんでした。');
			return;
		}

		const { summoner, league } = data;
		if (rank && tier) league.response.push({ tier, rank, queueType: '_リーダーセット' } as any);

		const embed = new MessageEmbed()
			.setColor('RED')
			.setThumbnail(
				`http://ddragon.leagueoflegends.com/cdn/${(await this.container.lol.DataDragon.getVersions())[0]}/img/profileicon/${
					summoner.response.profileIconId
				}.png`
			)
			.setTitle(summoner.response.name)
			.setDescription(`**レベル**: ${summoner.response.summonerLevel}`)
			.addField(
				'ランク:',
				Boolean(league.response.length)
					? league.response
							.map(
								(val) =>
									`<:a:${EMOJIS.RANKS[val.tier as 'IRON']}> ${val.tier} ${val.rank} (${val.queueType.split('_')[1].toLowerCase()})`
							)
							.join('\n')
					: '未参加'
			);

		await interaction.editReply({ embeds: [embed] });
		await this.container.db.collection('users').updateOne(
			{ uid },
			{
				$set: {
					id: summoner.response.id,
					puuid: summoner.response.puuid,
					profileIconId: summoner.response.profileIconId,
					name: summoner.response.name,
					flex: league.response.find((val) => val.queueType === Constants.Queues.RANKED_FLEX_SR)
						? {
								tier: league.response.find((val) => val.queueType === Constants.Queues.RANKED_FLEX_SR)?.tier,
								rank: league.response.find((val) => val.queueType === Constants.Queues.RANKED_FLEX_SR)?.rank
						  }
						: undefined,
					solo: league.response.find((val) => val.queueType === Constants.Queues.RANKED_SOLO_5x5)
						? {
								tier: league.response.find((val) => val.queueType === Constants.Queues.RANKED_SOLO_5x5)?.tier,
								rank: league.response.find((val) => val.queueType === Constants.Queues.RANKED_SOLO_5x5)?.rank
						  }
						: undefined,
					leaderSet: league.response.find((val) => val.queueType === '_リーダーセット')
						? {
								tier: league.response.find((val) => val.queueType === '_リーダーセット')?.tier,
								rank: league.response.find((val) => val.queueType === '_リーダーセット')?.rank
						  }
						: undefined
				}
			},
			{ upsert: true }
		);
	}
}
