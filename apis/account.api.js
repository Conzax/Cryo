const { MongoClient, ObjectID } = require('mongodb');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const { Router } = require('express');
const router = Router();

const config = require('../config.json');
const prompt = require('../cli');
const cli = require('../cli');
const chalk = require('chalk');

router.use(bodyParser.urlencoded({extended: false}));

router.get('/authorize', (req, res) => {
    if (req.body.token == config.token) {
        MongoClient.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true 
        }, (error, database) => {
            if (error) throw error;
            database.db('cryo').collection('accounts').findOne({email: req.body.email, password: encrypt(req.body.password)}).then((result) => {
                if (result) { res.status(200).end() } else { makeError(res, 'errors.com.conzax.account.not_found', 'Account not found', 'null', '500', 'account') }
            });
        });
    } else { makeError(res, 'errors.com.conzax.authorization_failed', 'Authorization failed', 'null', '500', 'account') }
});

router.post('/create', (req, res) => {
    if (req.body.token == config.token) {
        MongoClient.connect(config.mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true 
        }, (error, database) => {
            if (error) throw error;
            database.db('cryo').collection('accounts').findOne({email: req.body.email}).then((result) => {
                if (result) { makeError(res, 'errors.com.conzax.account.already_exist', 'Account already exist', 'null', '500', 'account') } else {
                    database.db('cryo').collection('accounts').insertOne({
                        email: req.body.email,
                        password: encrypt(req.body.password)
                    });
                    database.db('cryo').collection('accounts').findOne({email: req.body.email}).then((result) => {
                        res.status(200).end();
                        console.log(`${chalk.greenBright('Successfully')}: ${chalk.yellowBright(`Account ${result._id} created`)}`);
                        cli.InitPrompt();
                    });
                }
            });
        });
    } else { makeError(res, 'errors.com.conzax.authorization_failed', 'Authorization failed', 'null', '500', 'account') }
});

router.post('/get', (req, res) => {
    if (req.body.token == config.token) {
        if (Buffer.from(req.body.id).length == 24) {
            MongoClient.connect(config.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true 
            }, (error, database) => {
                database.db('cryo').collection('accounts').findOne({ _id: ObjectID(req.body.id) }).then((result) => {
                    res.json(result);
                });
            });
        } else { makeError(res, 'errors.com.conzax.account.incorrect_id', 'Incorrect ID', 'null', '500', 'account') }
    } else { makeError(res, 'errors.com.conzax.authorization_failed', 'Authorization failed', 'null', '500', 'account') }
});

function makeError(res, errorName, errorMessage, numericErrorCode, statusCode, originatingService) {
    return res
			.status(statusCode)
			.set("Conzax-Error-Code", numericErrorCode)
			.set("Conzax-Error-Name", errorName)
			.json({
				"errorName": errorName,
				"errorMessage": errorMessage,
				"numericErrorCode": numericErrorCode,
				"originatingService": originatingService
			});
};

function encrypt(data) {
    var cipher = crypto.createCipher('aes-256-ctr', '340fae9056581cac935b459bc8be7bdf7d362f591117e1cad1f074891a4ce71ae9b90e4083162ebb40f4a4a53a27f96e36de00f7b430c830f4ab87e159a33172');
    var crypted = cipher.update(data,'utf8','hex');
    crypted += cipher.final('hex');
    return crypted;
};

module.exports = router;
