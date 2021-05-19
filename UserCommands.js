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
	requiredModules: ['db', 'fs'],
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
	const db = require('db');
	const helpers = require('helpers');
	const fs = require('fs');

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
		},
		'message': {
			'Description': 'Send a message to another user',
			'Aliases': ['m', 'mail', 'msg'],
			'-r': 'Receiver ID (You can find it in the client description)',
			'-m': 'Message',
			'-g': 'Get Messages',
			'Example': '!m -r 1 -m Hello, skitji'
		}
	}

	

//========================================================================================
/*                                                                                      *
 *                                       Databases                                      *
 *                                                                                      */
//========================================================================================

	parseString = (numberBuffer) => {
		if (!Array.isArray(numberBuffer)) return "";
		const bytewriter = helpers.newBytes();
		numberBuffer.forEach(num => bytewriter.append(helpers.bytesFromHex(num.toString(16))));
		return bytewriter.toString();
	}

	let db_msg;

	const db_connect = () => {
		if(fs.exists('data/database.json')) {
			db_msg = db.connect(JSON.parse(fs.readFile('data/database.json').toString()), (err) => {
				if(err) engine.log(err);
			})
			if(db_msg) 
				db_msg.exec('CREATE TABLE `teamspeak_msg`.`user` ( `id` INT NOT NULL AUTO_INCREMENT , `last_name` TEXT NOT NULL , `UID` TEXT NOT NULL , PRIMARY KEY (`id`)) ENGINE = InnoDB;');
			if(db_msg) 
				db_msg.exec('CREATE TABLE `teamspeak_msg`.`messages` ( `id` INT NOT NULL AUTO_INCREMENT , `sender_id` INT NOT NULL , `receiver_id` INT NOT NULL , `date` TEXT NOT NULL , `message` TEXT NOT NULL ,`read` BOOLEAN NOT NULL , UNIQUE (`id`)) ENGINE = InnoDB;');
		}	
	}

	db_connect();

	
//========================================================================================
/*                                                                                      *
 *                                        Events                                        *
 *                                                                                      */
//========================================================================================
	event.on('chat', (ev) => {
		if (ev.mode == 1) {
			main(ev.text, ev.client);
		}
	});

	event.on('channelDelete', (ev) => {
		userChannels = userChannels.filter(x => x != ev.id());
		if (userChannels.length == 0) deleteUserChannelsHeader();
	});

	event.on('clientMove', (ev)  => {
		let client = ev.client;
		if(!ev.fromChannel) {
			sendCommands(client, undefined);
			db_msg.query('SELECT * FROM user WHERE UID = ?', client.uid(), (err, res) => {
				
				if(err) {
					engine.log(err);
					return;
				}
				if(res.length < 1) {
					db_msg.exec('INSERT INTO `user` (`id`, `last_name`, `UID`) VALUES (NULL, ?, ?)', client.name(), client.uid());
				} else {
					db_msg.exec('UPDATE `user` SET `last_name` = ? WHERE `user`.`UID` = ?', client.name(), client.uid());
				}
				db_msg.query('SELECT `id` FROM user WHERE UID = ?', client.uid(), (err, res) => {
					client.setDescription(`Message ID: ${res[0].id} || ${(client.description().split('||')[1] == undefined) ? '' : client.description().split('||')[1] }`)
				})
			})
		}
	})

	//INSERT INTO `user` (`id`, `last_name`, `UID`) VALUES (NULL, 'skitji', 'dieNnTZoqzsh2Yu4PnRD4eFoyAY=');

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
		let cmd = getCommand(command.trim().split(" ")[0].replace('!', '').trim());
		let splittedCommand = command.trim().split("-");
		splittedCommand
			.slice(1, splittedCommand.length)
			.map(x => x.trim().split(" "))
			.forEach(x => {
				if(x.length > 1) {
					args.set(x[0], x.slice(1, x.length).reduce((a, b) => a + ' ' + b, '').trim());
				} else {
					args.set(x[0], undefined);
				}
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
			case 'message':
				msg(sender, args);
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
	let userChannels = [];
	let userHeaderChannels = [];
	let parentIndex;

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
 *                                          Msg                                         *
 *                                                                                      */
//========================================================================================	

	const sendMessage = (senderId, receiverId, message) => {
		let now = new Date();
		db_msg.exec('INSERT INTO `messages` (`id`, `sender_id`, `receiver_id`, `date`, `message`, `read`) VALUES (NULL, ?, ?, ?, ?, false)', senderId, receiverId, now.toUTCString(), message);
	}

	const msg = (sender, args) => {
		if(args.get('g')) {
			getMessages(sender);
			return;
		}
		db_msg.query('SELECT `id`, `last_name` FROM user WHERE UID = ?', sender.uid(), (err, res) => {
			sendMessage(res[0].id, args.get('r'), args.get('m'));
		});

		db_msg.query('SELECT `last_name`, `UID` FROM user WHERE id = ?', args.get('r'), (err, res) => {
			if(res.length > 0) {
				sender.chat(`Message "${args.get('m')}" sent to ${parseString(res[0].last_name)}`);
				for(let onlineClient of backend.getClients()) {
					if(onlineClient.uid() == parseString(res[0].UID)) {
						onlineClient.chat('You have got a new message!');
						break;
					}
				}
			} else {
				sender.chat(`No client with id ${args['r']} found`);
			}
			
		})
		
		
	}

	const getMessages = async (sender) => {
		let msgs = '';
		if(parseInt(sender.getVersion().charAt(0)) < 5) {
			msgs += '\n';
		}
		msgs +=  '+++ \n';
		let id = (await db_msg.query('SELECT `id` FROM user WHERE UID = ?', sender.uid()))[0].id;
		let messagesEncrypt = await db_msg.query('SELECT `sender_id`, `date`, `message` FROM messages WHERE `receiver_id` = ? AND `read`=0', id);
		db_msg.exec('UPDATE `messages` SET `read` = 1 WHERE `messages`.`receiver_id` = ? AND `messages`.`read`=0', id);
		if(messagesEncrypt.length > 0) {
			for(let msg of messagesEncrypt) {
				let sender = await db_msg.query('SELECT `last_name` FROM `user` WHERE id=?', msg.sender_id)[0].last_name;
				let date = new Date(parseString(msg.date));
				let dateString = `${addZero(date.getDate())}.${addZero(date.getMonth())}., ${addZero(date.getHours())}:${addZero(date.getMinutes())} `; 
				msgs += `[${dateString}] ${parseString(sender)} -> ${parseString(msg.message)} \n`;
			}
		} else {
			msgs += 'No new messages \n';
		}
		
		sender.chat(msgs + '+++');
	}

	const addZero = (num) => {
		if(num < 10) {
			return '0' + num;
		}
		return '' + num;
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