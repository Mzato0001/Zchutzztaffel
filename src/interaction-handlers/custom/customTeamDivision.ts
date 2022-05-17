import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework';
import { CustomInteractionHandler } from './custom';

import type { ButtonInteraction, MessageActionRow, Snowflake } from 'discord.js';

@ApplyOptions<InteractionHandlerOptions>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonInteractionHandler extends CustomInteractionHandler {
	public override async parse(interaction: ButtonInteraction) {
		if (!interaction.customId.startsWith('customTeamDivision')) return this.none();
		await interaction.deferUpdate();
		return this.some({ tid: interaction.customId.split(':')[1] as Snowflake, index: Number(interaction.customId.split(':')[2]) });
	}

	public override async run(interaction: ButtonInteraction, parsedData: InteractionHandler.ParseResult<this>) {
		// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
		const summoners = (
			await this.container.db
				.collection('customs')
				.findOneAndUpdate({ tid: parsedData.tid }, { $set: { date: new Date() } }, { returnDocument: 'after' })
		)?.value?.data!;
		const components: MessageActionRow[] = (interaction.message.components as MessageActionRow[]) || [];
		components[components.length - 1].components[0].setCustomId(`customTeamDivision:${parsedData.tid}:${parsedData.index + 1}`);
		components[components.length - 1].components[1].setCustomId(
			(() => {
				const customId =
					components[components.length - 1].components[1].customId || `customShowResult:${parsedData.tid}:${parsedData.index + 1}:0`;
				const args = customId?.split(':');
				args[1] = parsedData.tid;
				args[2] = `${parsedData.index + 1}`;
				return args.join(':');
			})()
		);
		await interaction.editReply({
			embeds: [this.generateEmbed(summoners, parsedData.index + 1)],
			components
		});
	}
}
