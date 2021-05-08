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
	}]
}, function(sinusbot, config) {
	const engine = require('engine');
	const backend = require('backend');
	const event = require('event');
	const helpMessages = {
		'channel': '-p set a password \n -dm don\'t move' 
	}
	var userChannels = [];
	var userHeaderChannels = [];
	var parentIndex;
	
	event.on('chat', function(ev) {
		if(ev.mode == 1) {
			main(ev.text, ev.client);
		}
	});

	/**
	 * Handles with incomming commands
	 * @param {string} command with ![cmd] [args]
	 * @param {Client} sender client who send command
	 */
	const main = (command, sender) => {
		let args = new Map();
		let splittedCommand = command.trim().split("-");
		let cmd = splittedCommand[0].replace('!', '').trim();
		splittedCommand
				.slice(1,splittedCommand.length)
				.map(x => x.trim().split(" "))
				.forEach(x => {
					args.set(x[0], x[1]);
				});
		for([key, value] of args) {
			if(key == 'h') sender.chat('Help for !' + cmd + '\n' + helpMessages[cmd]);
			if(key == 'p' && value == undefined) break;
			if(value == undefined) args.set(key, true);
		}
		switch (cmd) {
			case 'channel':
				return createUserChannel(sender, args);
			default:
				break;
		}
	}
	
	/**
	 * Creates a channel for the sender
	 * @param {Client} sender client who send command
	 * @param {Map<string,string>} args arguments for command
	 */
	const createUserChannel = (sender, args) => {
		if(userChannels.length == 0) createUserChannelsHeader();
		var channelName = config.name.replace('%c', sender.name());
		var create = backend.createChannel({parent: userHeaderChannels[parentIndex].id(), name: channelName});
		if(args.get('p') != undefined) {
			create.setPassword(args.get('p'))
		}
		perm = create.addPermission("i_icon_id");
		perm.setValue(config.IconId);
		perm.save();
		userChannels.push(create.id());
		if(!args.get('dm')) {
			sender.moveTo(create);
		}
		
	}

	/**
	 * Creates the header for all user channels
	 */
	const createUserChannelsHeader = () => {
		userHeaderChannels.push(backend.createChannel({name: '[*spacer998]___', parent: 0, permanent: true}));
		userHeaderChannels.push(backend.createChannel({name: '[cspacer] User Channels', parent: 0, permanent: true}));
		parentIndex = 1;
		userHeaderChannels.push(backend.createChannel({name: '[*spacer999]___', parent: 0, permanent: true}));
	}

	/**
	 * Deletes the header for all user channels
	 */
	const deleteUserChannelsHeader = () => {	
		userHeaderChannels.forEach(x => x.delete());
		userHeaderChannels = []
	}
	
	event.on('channelDelete', function(ev) {
		userChannels = userChannels.filter(x => x != ev.id());
		if(userChannels.length == 0) deleteUserChannelsHeader();
	});
})