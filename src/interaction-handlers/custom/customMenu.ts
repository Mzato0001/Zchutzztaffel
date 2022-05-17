import { MessageActionRow, MessageButton, SelectMenuInteraction, SnowflakeUtil } from 'discord.js';

import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';

import { CustomInteractionHandler } from './custom';

import type { SummonerLeagueDto } from 'twisted/dist/models-dto';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class SelectMenuInteractionHandler extends CustomInteractionHandler {
	public override async parse(interaction: SelectMenuInteraction) {
		if (interaction.customId !== 'customMenu') return this.none();
		await interaction.deferUpdate();
		return this.some({ tid: interaction.values[0].split(':')[0], summonerNames: interaction.values.map((val) => val.split(':')[1]) });
	}

	public override async run(interaction: SelectMenuInteraction, parsedData: InteractionHandler.ParseResult<this>) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
		let summoners: SummonerLeagueDto[] = (
			await this.container.db
				.collection('customs')
				.findOneAndUpdate({ tid: parsedData.tid }, { $set: { date: new Date() } }, { returnDocument: 'after' })
		)?.value?.data!;
		const components: MessageActionRow[] = (interaction.message.components as MessageActionRow[]) || [];
		if (summoners.length > 10) {
			summoners = summoners.filter((summoner) => parsedData.summonerNames.includes(summoner.summonerName));
			parsedData.tid = SnowflakeUtil.generate();
			await this.container.db.collection('customs').insertOne({ tid: parsedData.tid, data: summoners, date: new Date() });
		}
		if (components.length === 1)
			components.push(
				new MessageActionRow().addComponents(
					new MessageButton().setCustomId(`customTeamDivision:${parsedData.tid}:0`).setLabel('チーム分け').setStyle('DANGER'),
					new MessageButton().setCustomId(`customShowResult:${parsedData.tid}:0:0`).setLabel('結果を発表').setStyle('DANGER')
				)
			);
		else {
			components[1].components[0].setCustomId(`customTeamDivision:${parsedData.tid}:0`);
			components[1].components[1].setCustomId(
				(() => {
					const customId = components[1].components[1].customId || `customShowResult:${parsedData.tid}:0:0`;
					const args = customId?.split(':');
					args[1] = parsedData.tid;
					return args.join(':');
				})()
			);
		}
		await interaction.editReply({ embeds: [this.generateEmbed(summoners)], components });
	}
}
