import { ContextMenuInteraction, GuildMemberRoleManager, MessageActionRow, Modal, ModalActionRowComponent, TextInputComponent } from 'discord.js';

import { ContextMenuCommandBuilder } from '@discordjs/builders';
import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command, CommandOptions, RegisterBehavior } from '@sapphire/framework';

@ApplyOptions<CommandOptions>({
	name: 'League Connect',
	description: 'Leagueアカウントをコネクトします',
	requiredClientPermissions: ['USE_EXTERNAL_EMOJIS'],
	requiredUserPermissions: ['USE_EXTERNAL_EMOJIS']
})
export default class TeamCommand extends Command {
	public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
		registry.registerContextMenuCommand(new ContextMenuCommandBuilder().setName(this.name).setType(2).setDefaultPermission(true), {
			idHints: ['976112013359079435', '976112015741452289'],
			guildIds: ['500761659967668254', '686947837371875416'],
			behaviorWhenNotIdentical: RegisterBehavior.Overwrite
		});
	}

	public async contextMenuRun(interaction: ContextMenuInteraction) {
		if (!(interaction.member?.roles as GuildMemberRoleManager).cache.has('837822342221791294') && interaction.user.id !== '357153927902527488') {
			await interaction.reply('このコマンドを使用するには、「オフィサー」のロールを持っている必要があります。');
			return;
		}
		const user = await this.container.db.collection('users').findOne({ uid: interaction.targetId });

		const modal = new Modal()
			.setTitle('Leagueアカウント')
			.setCustomId(`connectModal:${interaction.targetId}`)
			.addComponents(
				new MessageActionRow<ModalActionRowComponent>().addComponents(
					new TextInputComponent()
						.setLabel('ゲームの名')
						.setCustomId('connectName')
						.setRequired(true)
						.setStyle('SHORT')
						.setPlaceholder('ゲームの名を入力してください。')
						.setValue(user?.name || '')
				),
				new MessageActionRow<ModalActionRowComponent>().addComponents(
					new TextInputComponent()
						.setLabel('ランク')
						.setCustomId('connectRank')
						.setStyle('SHORT')
						.setPlaceholder('ランクを入力してください。	既定はサモナーのランク(DUO)です。')
						.setValue(user?.leaderSet?.tier || user?.solo?.tier || '')
				),
				new MessageActionRow<ModalActionRowComponent>().addComponents(
					new TextInputComponent()
						.setLabel('ティア')
						.setCustomId('connectDivision')
						.setStyle('SHORT')
						.setPlaceholder('ティアを入力してください。	既定はサモナーのティア(DUO)です。')
						.setValue(user?.leaderSet?.rank || user?.solo?.rank || '')
				)
			);

		await interaction.showModal(modal);
	}
}
