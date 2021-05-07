registerPlugin({
	name: 'UserChannelCreator',
	version: '0.0.0',
	backends: ['ts3'],
	engine: '>= 0.13.37',
    description: 'Creates Channel when User needed',
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
	var engine = require('engine');
	var backend = require('backend');
	var event = require('event');
	var userChannels = [];
	var userHeaderChannels = [];
	var parentIndex;
	
	event.on('chat', function(ev) {
		if(ev.mode == 1) {
			main(ev.text, ev.client);
		}
		
	});

	const main = (command, sender) => {
		let args = new Map();
		let cmd = command.split("-")[0].replace('!', '').trim();
		command.trim()
				.split("-")
				.slice(1,command.split("-").length)
				.map(x => x.trim().split(" "))
				.forEach(x => {
					engine.log("x" + x);
					args.set(x[0], x[1]);
				});
		for([key, value] of args) {
			if(key == 'p' && value == undefined) break;
			if(value == undefined) args.set(key, true);
		}
		
		engine.log(args.get('p'));
		engine.log(args.get('dm'));
		engine.log(cmd + "|");
		switch (cmd) {
			case 'channel':
				return createUserChannel(sender, args);
			default:
				break;
		}
	}
	
	const createUserChannel = (sender, args) => {
		createUserHeaderChannels();
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

	const createUserHeaderChannels = () => {
		if(userChannels.length == 0) {
			userHeaderChannels.push(backend.createChannel({name: '[*spacer998]___', parent: 0, permanent: true}));
			userHeaderChannels.push(backend.createChannel({name: '[cspacer] User Channels', parent: 0, permanent: true}));
			parentIndex = 1;
			userHeaderChannels.push(backend.createChannel({name: '[*spacer999]___', parent: 0, permanent: true}));
		}
	}
	
	event.on('channelDelete', function(ev) {
		userChannels = userChannels.filter(x => x != ev.id());
		if(userChannels.length == 0) {
			userHeaderChannels.forEach(x => x.delete());
			userHeaderChannels = [];
		}
	});
})