var jsonResponse = require('../jsonResponse');
var util = require('../utility');
//var FormData = require('form-data');
var http = require('http');
var url = require("url");
var express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const nameFile = path.basename(__filename);
const mongoose = require("mongoose");
require('./mongodb.js');
var router = express.Router();
var jsonParser = bodyParser.json();
require("../models/permission/DymerUser");
/* AC MG */
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
/* AC MG */
const DymerUser = mongoose.model("DymerUser");
const axios = require('axios');
const logger = require('./dymerlogger')
var crypto = require('crypto');
const { Console } = require('console');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

// duser
router.get('/', util.checkIsAdmin,(req, res) => {
    var ret = new jsonResponse();
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var queryFind = {};
    let regex = /(?<!^).(?!$)/g;
    DymerUser.find(queryFind).then((els) => {
        ret.setMessages("List");
        /*  els.forEach(element => {
              element.password=(  element.password).replace(regex, '*');
          });*/
        ret.setData(els);
        // console.log(ret);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | get/ | : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

// AC - MG 0Day -> creation Admin default START
router.post('/defaultadmin', (req, res) => {
    let ret = new jsonResponse();

    //DymerUser.find({ roles: { $in: ['app-admin'] } }).then(el => {
    DymerUser.find({ "roles.role": 'app-admin' }).then(el => {
        if (el.length > 0) {
            ret.setMessages("Admin already exists");
            ret.setSuccess(true);
            return res.send(ret);
        } else {

            let userModel = new DymerUser(req.body);
            userModel.roles = [{role : 'app-admin'}];

            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    console.error("Error generating salt:", err);
                    ret.setMessages("Error generating salt");
                    ret.setSuccess(false);
                    return res.send(ret);
                }

                bcrypt.hash(userModel.password, salt, (err, hashedPassword) => {
                    if (err) {
                        console.error("Error hashing password:", err);
                        ret.setMessages("Error hashing password");
                        ret.setSuccess(false);
                        return res.send(ret);
                    }
                    userModel.password = hashedPassword;
                    userModel.salt = salt;

                    userModel.save().then((el) => {
                        ret.setMessages("Default admin created successfully");
                        ret.addData(el);
                        return res.send(ret);
                    }).catch((err) => {
                        console.error("ERROR | " + nameFile + " | defaultadmin | save:", err);
                        logger.error(nameFile + ' | defaultadmin | save: ' + err);
                        ret.setMessages("Post error");
                        ret.setSuccess(false);
                        ret.setExtraData({ "log": err.stack });
                        return res.send(ret);
                    });
                });
            });
        }
    }).catch((err) => {
        console.error("ERROR | " + nameFile + " | defaultadmin | find: ", err);
        logger.error(nameFile + ' | defaultadmin | find: ' + err);
        ret.setMessages("Error fetching data");
        ret.setSuccess(false);
        ret.setExtraData({ "log": err.stack });
        return res.send(ret);
    });
});

router.post('/generate-token', (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

     console.error("chiamata per generare il token di risposta");
	//const secretKey = process.env.JWT_SECRET_KEY
    //const encryptKey = process.env.ENCRYPTION_SECRET_KEY
	//const refreshSecretKey = process.env.REFRESH_SECRET_KEY //TODO refresh 
    // DymerUser.findOne({ username: username, "roles.role" : 'app-admin' }).then(el => {
    DymerUser.findOne({ username: username }).then(el => {
        if (!el) {
            return res.status(401).send("Admin not found");
        }
        bcrypt.compare(password, el.password, (err, isMatch) => {
            if (err) {
                console.error("Error comparing password:", err);
                return res.status(500).send("Internal server error");
            }
            if (isMatch) {
                console.log(nameFile + " | generate-token | Password matched, el da db"+ el);
				const plainPayload = JSON.stringify({ username: el.username, roles: el.roles, email: el.email })
                //VL const encryptedPayload = util.encrypt(encryptKey, plainPayload)
                const encryptedPayload = util.encrypt(plainPayload)
                const token = util.generateJWTToken(encryptedPayload);
                //const token = jwt.sign({ data: encryptedPayload}, secretKey, { expiresIn: "1h" });
				//VL login start
				//TODO refresh  
				//const refreshToken = jwt.sign({data: encryptedPayload}, refreshSecretKey, { expiresIn: '7d' });	//TODO refresh 																					   
                const csrfToken = util.generateHexString(64);
                el.csrfToken = csrfToken;
				//el.refreshToken = refreshToken; //TODO refresh						   
                el.timestamp = Date.now();
                console.log(">>>csrfToken ", csrfToken);
                el.save()
                    .then(user => {
                        console.log(`${user.username} updated!`);
                    })
                    .catch(err => {
                        console.log(`Error while adding csfrtoken: ${err}`);
                    });
                //VL login end  
				//return res.json({token: token, refreshToken: refreshToken, csrfToken: csrfToken});//TODO refresh
                return res.json({token: token, csrfToken: csrfToken});
            } else {
				console.log(nameFile + " | generate-token | Invalid password ");
				return res.status(401).send("Invalid password");
            }
        });
    }).catch(err => {
        console.error("ERROR " + nameFile + " | defaultadmin | login error :", err);
        return res.status(500).send("Internal server error");
    });
});
/*TODO refresh, protect endpoint, 
router.post('/refresh-token', (req, res) => {
    console.log(nameFile + "| refresh-token| req.url:", req.url);
    console.log(nameFile + "| refresh-token| req.ip:", req.ip);
    console.log(nameFile + "| refresh-token| req.originalUrl:", req.originalUrl);
    let refresh_token = req.body.refresh_token;
    console.log(nameFile + "| refresh-token| refresh_token " + req.body.refresh_token );
    const secretKey = process.env.JWT_SECRET_KEY
    const encryptKey = process.env.ENCRYPTION_SECRET_KEY
    const refreshSecretKey = process.env.REFRESH_SECRET_KEY

    if (!refresh_token) {
        console.log(nameFile + ' | refresh-token | refresh_token: '+ refresh_token);
        return res.status(401).send('Refresh token empty!');
    }

    jwt.verify(refresh_token, refreshSecretKey, (err, decodedPayload) => {
        if (err) {
            console.log(nameFile +' | refresh-token | Refresh token expired or invalid: ', err);
            return res.status(403).send('Refresh token expired or invalid');
        }
        console.log(nameFile +' | refresh-token | decodedRefreshToken: ', decodedPayload);
        DymerUser.findOne({ refreshToken: refresh_token }).then(el => {
            console.log(nameFile +' | refresh-token | el: ', el);
            if (!el) {
                console.log(nameFile +' | refresh-token | Refresh token invalid: ', el);
                return res.status(401).send('Refresh token invalid');
            }

            const plainPayload = JSON.stringify({
                username: el.username,
                roles: el.roles,
                email: el.email
            });
            console.log(nameFile +' | refresh-token | el1: ', el);
            const newEncryptedPayload = util.encrypt(encryptKey, plainPayload);

            const newToken = jwt.sign({ data: newEncryptedPayload }, secretKey, { expiresIn: "1h" });
            const newRefreshToken = jwt.sign({ data: newEncryptedPayload }, refreshSecretKey, { expiresIn: "7d" });
            const newCsrfToken = util.generateHexString(64);
            console.log(nameFile + "newToken " + newToken );
            console.log(nameFile + "newRefreshToken " + newRefreshToken );
            console.log(nameFile + "newCsrfToken " + newCsrfToken );

            el.token = newToken;
            el.refreshToken = newRefreshToken;
            el.csrfToken = newCsrfToken;
            el.timestamp = Date.now();

            el.save((err) => {
                if (err) {
                    return res.status(500).send('Error saving tokens');
                }
                return res.json({token: newToken, refreshToken: newRefreshToken, csrfToken: newCsrfToken});
            });
        });
    });

});*/											 

router.post('/checklogin' , function(req, res) {
    console.log(nameFile + " | checklogin | checkhook");
    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    var email = req.body.email;
    var password = req.body.password;
    //VL const secretKey = process.env.JWT_SECRET_KEY;
    password = util.encrypt(password);

    var queryFind ={ "email": email,"password":password,"active": true };

    DymerUser.find(queryFind).then((els) => {
        ret.setMessages("List");
        ret.setData(els);
        //  console.log(ret);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | get/ | : ' + err);
            ret.setMessages("Get error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

// AC reset password  0day - START
//TODO check 0day
router.post('/reset-password', util.checkIsAdmin,(req, res) => {
        const { email, oldPassword, newPassword } = req.body;
        let ret = new jsonResponse();

        if (!email || !oldPassword || !newPassword) {
            ret.setMessages("Missing data");
            ret.setSuccess(false);
            return res.status(400).send(ret);
        }

        // Check for existing admin and password
        DymerUser.findOne({ email }).then(admin => {
            if (!admin) {
                ret.setMessages("Admin not found");
                ret.setSuccess(false);
                return res.status(404).send(ret);
            }

            bcrypt.compare(oldPassword, admin.password, (err, isMatch) => {
                if (err) {
                    console.error("Error comparing passwords:", err);
                    ret.setMessages("Error verifying password");
                    ret.setSuccess(false);
                    return res.status(500).send(ret);
                }

                if (!isMatch) {
                    ret.setMessages("Old password is incorrect");
                    ret.setSuccess(false);
                    return res.status(403).send(ret);
                }

                // admin exist and old password is correct. Updating
                bcrypt.genSalt(10, (err, salt) => {
                    if (err) {
                        console.error("Error generating salt:", err);
                        ret.setMessages("Error generating salt");
                        ret.setSuccess(false);
                        return res.status(500).send(ret);
                    }

                    bcrypt.hash(newPassword, salt, (err, hashedPassword) => {
                        if (err) {
                            console.error("Error hashing password:", err);
                            ret.setMessages("Error hashing password");
                            ret.setSuccess(false);
                            return res.status(500).send(ret);
                        }

                        DymerUser.updateOne(
                            { email: admin.email },
                            {
                                $set: {
                                    password: hashedPassword,
                                    salt: salt
                                }
                            }
                        ).then(result => {
                            if (result.modifiedCount === 0) {
                                ret.setMessages("No changes were made");
                                ret.setSuccess(false);
                                return res.status(400).send(ret);
                            }

                            ret.setMessages("Password reset successfully");
                            ret.setSuccess(true);
                            return res.send(ret);
                        }).catch(err => {
                            console.error("Error updating admin:", err);
                            ret.setMessages("Error updating admin data");
                            ret.setSuccess(false);
                            ret.setExtraData({ log: err.stack });
                            return res.status(500).send(ret);
                        });
                    });
                });
            });
        }).catch(err => {
            console.error("Error finding admin:", err);
            ret.setMessages("Error fetching admin");
            ret.setSuccess(false);
            ret.setExtraData({ log: err.stack });
            return res.status(500).send(ret);
        });
    });
// AC reset password  0day - END

router.post('/', util.checkIsAdmin, function(req, res) {
	console.log(">>>post duser");
    logger.info(">>>post duser");
    let id = req.params.id;
    let callData = util.getAllQuery(req);
    let data = callData.data;
    var ret = new jsonResponse();
    let newUser=req.body;
    console.log( ' newUser : ', JSON.stringify(newUser));
    let us=newUser;
    //console.log(nameFile + ' | post | create : ', JSON.stringify(req.body));
    logger.info(nameFile + ' | post | create : ' + JSON.stringify(req.body));
   
      //console.log("aaaa",us.roles[0].role );

     // logger.info("aaaa",us.roles[0].role );

      DymerUser.find({ "email": us.email }).then(el => {
        if (el.length > 0) {
            logger.info(nameFile + ' | User '+us.username+' already exists');
            console.log(nameFile + ' | User '+us.username+' already exists');
           console.log(nameFile + ' | El '+el+' ');
            ret.setMessages("User "+us.username+" already exists");
            ret.setSuccess(true);
            return res.send(ret);
        } else {

            let userModel = new DymerUser(req.body);
           // userModel.roles = [{role : us.roles.role}];
            console.log(userModel)
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    console.error("Error generating salt:", err);
                    ret.setMessages("Error generating salt");
                    ret.setSuccess(false);
                    return res.send(ret);
                }

                bcrypt.hash(userModel.password, salt, (err, hashedPassword) => {
                    if (err) {
                        console.error("Error hashing password:", err);
                        ret.setMessages("Error hashing password");
                        ret.setSuccess(false);
                        return res.send(ret);
                    }
                    userModel.password = hashedPassword;
                    userModel.salt = salt;

                    userModel.save().then((el) => {
                        ret.setMessages("User created successfully");
                        ret.addData(el);
                        return res.send(ret);
                    }).catch((err) => {
                        console.error("ERROR | " + nameFile + " | customUser | save:", err);
                        logger.error(nameFile + ' | customUser | save: ' + err);
                        ret.setMessages("Post error");
                        ret.setSuccess(false);
                        ret.setExtraData({ "log": err.stack });
                        return res.send(ret);
                    });
                });
            });
        }
    }).catch((err) => {
        console.error("ERROR | " + nameFile + " | customUser | find: ", err);
        logger.error(nameFile + ' | customUser | find: ' + err);
        ret.setMessages("Error fetching data");
        ret.setSuccess(false);
        ret.setExtraData({ "log": err.stack });
        return res.send(ret);
    });
   
   
   
   
   /* const secretKey = "";
    let hash = crypto.createHash('sha1')
    let digest = hash.update(secretKey).digest().subarray(0, 16)
    const cipher = crypto.createCipheriv("aes-128-ecb", digest, null);
    let encryptedText = cipher.update(newUser.password, "utf-8", "hex");
    encryptedText += cipher.final("hex");
    newUser.password=encryptedText
    var mod = new DymerUser(newUser);

    mod.save().then((el) => {
        ret.setMessages("Element created successfully");
        ret.addData(el);
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | post | create : ' + err);
            ret.setMessages("Create error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })*/
});

router.delete('/:id', util.checkIsAdmin, (req, res) => {
    var ret = new jsonResponse();
    var id = req.params.id;
    var myfilter = { "_id": id };
    //console.log(nameFile + ' | delete/:id | id : ', id);
    logger.info(nameFile + ' | delete/:id | id : ' + id);
    DymerUser.findOneAndDelete(myfilter).then((el) => {
        ret.setMessages("Element deleted");
        return res.send(ret);
    }).catch((err) => {
        if (err) {
            console.error(err);
            logger.error(nameFile + ' | delete/:id : ' + err);
            ret.setMessages("Delete Error");
            ret.setSuccess(false);
            ret.setExtraData({ "log": err.stack });
            return res.send(ret);
        }
    })
});

// AC - edit user START
router.put('/:id', util.checkIsAdmin, async (req, res) => {
    let ret = new jsonResponse();
    let id = req.params.id;
    let body = req.body;

    try {
        logger.info(`${nameFile} | update/:id | id : ${id}`);

        const existingUser = await DymerUser.findById(id);
        if (!existingUser) {
            ret.setMessages("User not found");
            ret.setSuccess(false);
            return res.send(ret);
        }

        let updatedUser = { ...body };

        if (body.password && body.password.trim() !== '') {

            if (body.password === existingUser.password) {
                // non è stato modificato il campo password
                updatedUser.password = existingUser.password;
                updatedUser.salt = existingUser.salt;
            } else {
                // Password cambiata: nuovo hash e nuovo salt
                const newSalt = await bcrypt.genSalt(10);
                updatedUser.password = await bcrypt.hash(body.password, newSalt);
                updatedUser.salt = newSalt;
            }
        } else {
            // Campo vuoto: mantengo quella esistente
            updatedUser.password = existingUser.password;
            updatedUser.salt = existingUser.salt;
        }

        const result = await DymerUser.findByIdAndUpdate(id, updatedUser, { new: true });
        ret.setMessages("Element updated");
        ret.setExtraData(result);
        return res.send(ret);

    } catch (err) {
        console.error(err);
        logger.error(`${nameFile} | update/:id : ${err}`);
        ret.setMessages("Update Error");
        ret.setSuccess(false);
        ret.setExtraData({ log: err.stack });
        return res.send(ret);
    }
});
// AC - edit user END

module.exports = router;