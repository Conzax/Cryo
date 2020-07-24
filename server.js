const { prompt } = require('inquirer');
const commander = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const { MongoClient, ObjectID } = require('mongodb');
const express = require('express');
const server = express();

const config = require('./config.json');
const cli = require('./cli');

server.use('/api/account', require('./apis/account.api'));
server.use('/api/fortcups', require('./apis/fortcups.api'));

server.listen(config.port, () => {
    console.log(chalk.cyanBright(figlet.textSync('Cryo', { horizontalLayout: 'full' })));
    console.log(`Type ${chalk.cyanBright('<help>')} to show all commands`);
    cli.InitPrompt('cryo');
});