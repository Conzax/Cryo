const { prompt } = require('inquirer');
const commander = require('commander');
const chalk = require('chalk');
const boxen = require('boxen');
const crypto = require('crypto');
const { MongoClient, ObjectID } = require('mongodb');

const config = require('./config.json');
const fs = require('fs');

function commandPrompt() {
    prompt([
        { type: 'input', name: 'command', message: 'Cryo:' }
    ]).then(output => {
        switch(output.command) {
            case 'help':
                return getHelp();
            case 'about':
                return getAbout();
            case 'block':
                return block();
            case 'unblock':
                return unblock();
            case 'details':
                return getDetails();
            case 'token':
                return generateToken();
            case 'accesslevel':
                return setAccessLevel();
             case 'createapp':
                return createApp();
        }
    });
};

function getHelp() {
    console.log(`---\n${chalk.cyanBright('<details>')} - Get account details\n${chalk.cyanBright('<block>')}/${chalk.cyanBright('<unblock>')} - Block/Unblock account\n${chalk.cyanBright('<details>')} - Get account details\n${chalk.cyanBright('<token>')} - Generate new access token\n${chalk.cyanBright('<accesslevel>')} - Change account access level\n---`);
    commandPrompt();
};

function getAbout() {
    console.log(`${chalk.cyanBright('Conzax Cryo')} ${require('./package.json').version}\n${chalk.yellowBright('More information on cryo.conzax.com')}`);
    commandPrompt();
};

function block() {
    prompt([
        { type: 'input', name: 'id', message: 'Id:' }
    ]).then(answer => {
        if (Buffer.from(answer.id).length == 24) {
            MongoClient.connect(config.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true 
            }, (error, database) => {
                if (error) throw error;
                database.db('cryo').collection('accounts').updateOne({ _id: ObjectID(answer.id) }, { $set: { blocked: true } });
                console.log(chalk.yellowBright(`Account ${answer.id} blocked`));
                commandPrompt();
            });
        } else {
            console.log(`${chalk.redBright('Error')}: Incorrect ID`); 
            commandPrompt();
        };
    });
};

function unblock() {
    prompt([
        { type: 'input', name: 'id', message: 'Id:' }
    ]).then(answer => {
        if (Buffer.from(answer.id).length == 24) {
            MongoClient.connect(config.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true 
            }, (error, database) => {
                if (error) throw error;
                database.db('cryo').collection('accounts').updateOne({ _id: ObjectID(answer.id) }, { $set: { blocked: false } });
                console.log(chalk.yellowBright(`Account ${answer.id} unblocked`));
                commandPrompt();
            });
        } else {
            console.log(`${chalk.redBright('Error')}: Incorrect ID`); 
            commandPrompt();
        };
    });
};

function getDetails() {
    prompt([
        { type: 'input', name: 'id', message: 'Id:' }
    ]).then(answer => {
        if (Buffer.from(answer.id).length == 24) {
            MongoClient.connect(config.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true 
            }, (error, database) => {
                database.db('cryo').collection('accounts').findOne({ _id: ObjectID(answer.id) }).then((res) => {
                    if (res) {
                        console.log(chalk.yellowBright(boxen(`ID: ${res._id}\nEMAIL: ${res.email}\nPASSWORD: ${res.password}\nBLOCKED: ${res.blocked}`, { padding: 1, borderStyle: 'round' })));
                        commandPrompt();
                    } else { 
                        console.log(`${chalk.redBright('Error')}: Incorrect ID`);
                        commandPrompt();
                    }
                });
            });
        } else {
            console.log(`${chalk.redBright('Error')}: Incorrect ID`); 
            commandPrompt();
        };
    });
};

function generateToken() {
    var data = JSON.stringify({ port: config.port, token: crypto.randomBytes(64).toString('hex'), mongoUri: config.mongoUri })
    fs.writeFile('./config.json', data, (error) => {
        if (error) throw error;
        console.log(`${chalk.greenBright('Successfully')}: ${chalk.yellowBright('New token generated')}`);
        console.log(`${chalk.yellowBright('Notice')}: ${chalk.yellowBright('Token will be used only after server restart')}`);
        commandPrompt();
    });
};

function setAccessLevel() {
    console.log(`${chalk.yellowBright('Notice')}: ${chalk.yellowBright('Set account access level(0-3)')}`);
    prompt([
        { type: 'input', name: 'id', message: 'Id:' },
        { type: 'number', name: 'level', message: 'accessLevel:' }
    ]).then(answer => {
        if (Buffer.from(answer.id).length == 24) {
            if (answer.level > 3) {
                console.log(`${chalk.redBright('Error')}: Incorrect permissions range`); 
                commandPrompt();
            } else {
                MongoClient.connect(config.mongoUri, {
                    useNewUrlParser: true,
                    useUnifiedTopology: true 
                }, (error, database) => {
                    if (error) throw error;
                    database.db('cryo').collection('accounts').updateOne({ _id: ObjectID(answer.id) }, { $set: { accessLevel: answer.level } });
                    console.log(chalk.yellowBright(`Account ${answer.id} has been set to ${answer.level}`));
                    commandPrompt();
            });
        };
    }});
};

function createApp() {
    prompt([
        { type: 'input', name: 'name', message: 'App name:' },
        { type: 'input', name: 'owner', message: 'Owner id:' }
    ]).then(answer => {
        MongoClient.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true 
        }, (error, database) => {
            if (error) throw error;
            database.db(answer.name).collection('config').insertOne({ owner: answer.owner });
            console.log(chalk.yellowBright(`App ${answer.name} has been created. Owner:${answer.owner}`));
            commandPrompt();
        });
    });
};

function encrypt(data) {
    var cipher = crypto.createCipher('aes-256-ctr', 'topSecretSalt');
    var crypted = cipher.update(data,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
};

module.exports = {
    InitPrompt: function() {
        commandPrompt();
    }
};
