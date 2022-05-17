import { CommandInteraction, MessageActionRow, Modal, ModalActionRowComponent, TextInputComponent } from 'discord.js';

import { SlashCommandBuilder } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptions, RegisterBehavior } from '@sapphire/framework';

@ApplyOptions<CommandOptions>({
	name: 'custom',
	description: 'カスタムチーム分け',
	requiredClientPermissions: ['USE_EXTERNAL_EMOJIS'],
	requiredUserPermissions: ['USE_EXTERNAL_EMOJIS']
})
export default class TeamCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerChatInputCommand(new SlashCommandBuilder().setName(this.name).setDescription(this.description), {
			idHints: ['975437776440922152'],
			behaviorWhenNotIdentical: RegisterBehavior.Overwrite
		});
	}

	public async chatInputRun(interaction: CommandInteraction) {
		const modal = new Modal()
			.setTitle('カスタムチーム分け')
			.setCustomId('customModal')
			.addComponents(
				new MessageActionRow<ModalActionRowComponent>().addComponents(
					new TextInputComponent()
						.setLabel('メンバー')
						.setCustomId('memberInput')
						.setRequired(true)
						.setStyle('PARAGRAPH')
						.setPlaceholder('チャット欄をペーストしてください。')
				)
			);

		await interaction.showModal(modal);
	}
}
