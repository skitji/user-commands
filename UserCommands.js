/**
 * A script for sinusbot to add commands
 * @name UserCommands
 * @version 1.0.0
 * @author skitji
 * @listens channel, channelDelete
 */
registerPlugin({
	name: 'UserCommands',
	version: '1.0.0',
	backends: ['ts3'],
	engine: '>= 0.13.37',
	description: 'An easy way to add commands',
	author: 'skitji <info@skitji.de>',
	vars: [{
			name: 'GroupChannel',
			indent: 1,
			title: 'Group channel',
			type: 'channel'
		},
		{
			name: 'IconId',
			ident: 1,
			title: 'Icon ID',
			type: 'number'
		},
		{
			name: 'name',
			ident: 1,
			title: 'Channel Name (%c for client)',
			type: 'string'
		}
	]
}, function (sinusbot, config) {

//──── Imports ───────────────────────────────────────────────────────────────────────────
	const engine = require('engine');
	const backend = require('backend');
	const event = require('event');

//──── Parameters ────────────────────────────────────────────────────────────────────────
	const commandInfo = {
		'channel': {
			'Description': 'Creates your own channel',
			'Aliases': ['c', 'createchannel'],
			'-p': 'Sets a password',
			'-dm': 'If you don\'t want to be move'
		},
		'help': {
			'Description': 'Get all commands',
			'Aliases': ['commands', 'h'],
		}
	}
	
//========================================================================================
/*                                                                                      *
 *                                        Events                                        *
 *                                                                                      */
//========================================================================================
	event.on('chat', function (ev) {
		if (ev.mode == 1) {
			main(ev.text, ev.client);
		}
	});

	event.on('channelDelete', function (ev) {
		userChannels = userChannels.filter(x => x != ev.id());
		if (userChannels.length == 0) deleteUserChannelsHeader();
	});

//========================================================================================
/*                                                                                      *
 *                                    Main functions                                    *
 *                                                                                      */
//========================================================================================

	/**
	 * Handles with incomming commands
	 * @param {string} command with ![cmd] [args]
	 * @param {Client} sender client who send command
	 */
	const main = (command, sender) => {
		let args = new Map();
		let splittedCommand = command.trim().split("-");
		let cmd = getCommand(splittedCommand[0].replace('!', '').trim());
		splittedCommand
			.slice(1, splittedCommand.length)
			.map(x => x.trim().split(" "))
			.forEach(x => {
				args.set(x[0], x[1]);
			});
		
		for ([key, value] of args) {
			if (key == 'h') {
				let text = '';
				text += '!' + cmd + ':\n';
				for(k in commandInfo[cmd]) {
					text += k + '\t' + commandInfo[cmd][k] + '\n';
				}
				sender.chat(text);
				return;
			}
			if (key == 'p' && value == undefined) break;
			if (value == undefined) args.set(key, true);
		}
		switch (cmd) {
			case 'channel':
				createUserChannel(sender, args);
				break;
			case 'help':
				sendCommands(sender, args);
				break;
			default:
				sendCommands(sender, args);
				break;
		}
	}

	/**
	 * Checks alias and returns command
	 * @param {string} command command or alias
	 * @returns command
	 */
	const getCommand = (command) => {
		for(prop in commandInfo) {
			for(alias of commandInfo[prop]['Aliases']) {
				if(command == alias) {
					return prop;
				}
			}
		}
		return command;
	}

//========================================================================================
/*                                                                                      *
 *                                     User Channel                                     *
 *                                                                                      */
//========================================================================================

//──── Parameters ────────────────────────────────────────────────────────────────────────
	var userChannels = [];
	var userHeaderChannels = [];
	var parentIndex;

//──── Functions ─────────────────────────────────────────────────────────────────────────
	/**
	 * Creates a channel for the sender
	 * @param {Client} sender client who send command
	 * @param {Map<string,string>} args arguments for command
	 */
	const createUserChannel = (sender, args) => {
		if (userChannels.length == 0) createUserChannelsHeader();
		var channelName = config.name.replace('%c', sender.name());
		var create = backend.createChannel({
			parent: userHeaderChannels[parentIndex].id(),
			name: channelName
		});
		if (args.get('p') != undefined) {
			create.setPassword(args.get('p'))
		}
		perm = create.addPermission("i_icon_id");
		perm.setValue(config.IconId);
		perm.save();
		userChannels.push(create.id());
		if (!args.get('dm')) {
			sender.moveTo(create);
		}

	}

	/**
	 * Creates the header for all user channels
	 */
	const createUserChannelsHeader = () => {
		userHeaderChannels.push(backend.createChannel({
			name: '[*spacer998]___',
			parent: 0,
			permanent: true
		}));
		userHeaderChannels.push(backend.createChannel({
			name: '[cspacer] User Channels',
			parent: 0,
			permanent: true
		}));
		parentIndex = 1;
		userHeaderChannels.push(backend.createChannel({
			name: '[*spacer999]___',
			parent: 0,
			permanent: true
		}));
	}

	/**
	 * Deletes the header for all user channels
	 */
	const deleteUserChannelsHeader = () => {
		userHeaderChannels.forEach(x => x.delete());
		userHeaderChannels = []
	}

//========================================================================================
/*                                                                                      *
 *                                         Help                                         *
 *                                                                                      */
//========================================================================================

//──── Functions ─────────────────────────────────────────────────────────────────────────
	/**
	 * Sends a help message
	 * @param {Client} sender client who send command
	 * @param {Map<string,string>} args arguments for command
	 */
	const sendCommands = (sender, args) => {
		let text = '';
		for(key in commandInfo) {
			text += '!' + key + ':\n';
			for(k in commandInfo[key]) {
				text += k + '\t' + commandInfo[key][k] + '\n';
			}
		}
		sender.chat(text);
	}
})