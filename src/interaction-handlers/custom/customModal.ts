import { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, ModalSubmitInteraction, SnowflakeUtil } from 'discord.js';
import { Constants } from 'twisted';

import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';

import { EMOJIS } from '../../lib/constants';
import { CustomInteractionHandler } from './custom';

import type { SummonerLeagueDto } from 'twisted/dist/models-dto';
import type { Users } from '../../lib/schemas';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit
})
export class ModalInteractionHandler extends CustomInteractionHandler {
	public override async parse(interaction: ModalSubmitInteraction) {
		if (interaction.customId !== 'customModal') return this.none();
		await interaction.deferReply({ ephemeral: true });
		return this.some();
	}

	public override async run(interaction: ModalSubmitInteraction) {
		const chat = interaction.fields.getTextInputValue('memberInput');
		const members = chat
			.split('\n')
			.filter((line) => line.includes('がロビーに参加しました'))
			.map((line) => line.split('がロビーに参加しました')[0]);
		if (members.length < 10) {
			await interaction.editReply('10人以上参加してください。');
			return;
		}
		const summoners = (await Promise.all(
			members.map(async (member) => {
				const summoner = (await this.container.lol.Summoner.getByName(member, Constants.Regions.JAPAN)).response;
				const user = await this.container.db.collection('users').findOne({ id: summoner.id });
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const league = (await this.container.lol.League.bySummoner(summoner.id, Constants.Regions.JAPAN)).response;

				if (user)
					this.deepCompare(user, {
						name: summoner.name,
						profileIconId: summoner.profileIconId,
						id: summoner.id,
						solo: league.find((entry) => entry.queueType === 'RANKED_SOLO_5x5'),
						flex: league.find((entry) => entry.queueType === 'RANKED_FLEX_SR')
					});

				return Boolean(league.find((l) => l.queueType === Constants.Queues.RANKED_SOLO_5x5))
					? league.find((l) => l.queueType === Constants.Queues.RANKED_SOLO_5x5)
					: Boolean(league.find((l) => l.queueType === Constants.Queues.RANKED_FLEX_SR))
					? league.find((l) => l.queueType === Constants.Queues.RANKED_FLEX_SR)
					: { summonerName: summoner.name, rank: 'IV', tier: 'SILVER' };
			})
		)) as SummonerLeagueDto[];
		const tid = SnowflakeUtil.generate();
		await this.container.db.collection('customs').insertOne({ tid, data: summoners, date: new Date() });
		const embed = new MessageEmbed()
			.setTitle('カスタムチーム分け')
			.setColor('RED')
			.addFields(
				summoners.map((summoner) => ({
					name: summoner.summonerName,
					value: `<:a:${EMOJIS.RANKS[summoner.tier as 'IRON']}> ${summoner.tier} ${summoner.rank}`,
					inline: true
				}))
			);
		const components: MessageActionRow[] = [];
		if (summoners.length > 10) {
			components.unshift(
				new MessageActionRow().addComponents(
					new MessageSelectMenu()
						.setCustomId('customMenu')
						.setOptions(
							summoners.map((summoner) => ({
								label: summoner.summonerName,
								value: `${tid}:${summoner.summonerName}`,
								description: `${summoner.tier} ${summoner.rank}`,
								emoji: EMOJIS.RANKS[summoner.tier as 'IRON']
							}))
						)
						.setMinValues(10)
						.setMaxValues(10)
						.setPlaceholder('10人選んでください。')
				)
			);
			await interaction.editReply({ embeds: [embed], components });
		} else {
			components.unshift(
				new MessageActionRow().addComponents(
					new MessageButton().setCustomId(`customTeamDivision:${tid}:0`).setLabel('チーム分け').setStyle('DANGER'),
					new MessageButton().setCustomId(`customShowResult:${tid}:0:0`).setLabel('結果を発表').setStyle('DANGER')
				)
			);
			await interaction.editReply({
				embeds: [this.generateEmbed(summoners)],
				components
			});
		}
	}

	private update(user: Pick<Users, 'name' | 'profileIconId' | 'solo' | 'flex' | 'id'>) {
		void this.container.db.collection('users').updateOne({ id: user.id }, { $set: user });
	}

	private deepCompare(user: Users, summoner: Pick<Users, 'name' | 'profileIconId' | 'solo' | 'flex' | 'id'>) {
		if (
			user.name === summoner.name &&
			user.profileIconId === summoner.profileIconId &&
			user.solo?.rank === summoner.solo?.rank &&
			user.solo?.tier === summoner.solo?.tier &&
			user.flex?.rank === summoner.flex?.rank &&
			user.flex?.tier === summoner.flex?.tier
		) {
			return false;
		}
		this.update(summoner);
		return true;
	}
}
