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
	var channels = [];
	var mainChannels = [];
	var parentIndex;
	
	event.on('chat', function(ev) {
		var msg = ev.text;
		var cmdArgs = msg.split(' ');
		if(ev.mode == 1) {
			if(cmdArgs[0] == '!channel' && cmdArgs.length == 2) {
				createUserChannel(ev.client, cmdArgs[1]);
			} else {
				ev.client.chat('The command is !channel <password>')
			}
		}
		
	});
	
	function createUserChannel(client, pw) {
		if(channels.length == 0) {
			mainChannels.push(backend.createChannel({name: '[*spacer998]___', parent: 0, permanent: true}));
			mainChannels.push(backend.createChannel({name: '[cspacer] User Channels', parent: 0, permanent: true}));
			parentIndex = 1;
			mainChannels.push(backend.createChannel({name: '[*spacer999]___', parent: 0, permanent: true}));
		}
		var channelName = config.name.replace('%c', client.name());
		var create = backend.createChannel({parent: mainChannels[parentIndex].id(), name: channelName, password: pw});
		perm = create.addPermission("i_icon_id");
		perm.setValue(config.IconId);
		perm.save();
		channels.push(create.id());
		client.moveTo(create);
	}
	
	event.on('channelDelete', function(ev) {
		channels = channels.filter(x => x != ev.id());
		if(channels.length == 0) {
			mainChannels.forEach(x => x.delete());
			mainChannels = [];
		}
	});
})