var util = require('../utility');
//Marco var dymerOauth = require('./dymerOauth');
var jsonResponse = require('../jsonResponse');
var express = require('express');
var router = express.Router();
const multer = require('multer');
const bodyParser = require("body-parser");
const path = require('path');
const axios = require('axios');

const nameFile = path.basename(__filename);

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

// AC - MG - VL jwt-O_DAY START
router.post("/login", async function (req, res) {
    console.log(nameFile + " | login | ");
    let username = req.body.username;
    let password = req.body.password;
    
    

    let url_dservice = util.getServiceUrl("dservice") + '/api/v1/duser/generate-token'
    //let lsrole = [];
    try {
        //console.log("authenticate.js | generate-token invoked ");
        let response = await axios.post(url_dservice, {"username": username, "password": password})
        //console.log(">>>response ", response.data);
        const token = response.data.token;
		//const refreshToken = response.data.refreshToken;//TODO refresh_token												
        //VL old gui
        //res.cookie('token', token, {sameSite: 'strict'});

        //VL new gui
        let csrfToken = response.data.csrfToken;
        console.log("csrfToken ", csrfToken);
        //VL new gui
		
        //VL new gui dev -check new gui None does not work!!!
       res.cookie('token', token, {
           httpOnly: true,
           secure: false,
           sameSite: 'None',
       });

       /*VL new gui prod
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None',
        });*/
        let loggedUser = {};
        var obj_isi = {};
        
		const decodedString = Buffer.from(token.split('.')[1], 'base64').toString('utf-8');
        /*AC MG 0DAY start
		const payload = JSON.parse(decodedString);
		un normale decode in base64 senza valutare la firma, risulta vulnerabile
		AC MG 0DAY end*/
		let payload = util.getDecryptedPayload(token)

        obj_isi.roles = payload.roles;
        let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64")
        let dr_value = new Buffer(JSON.stringify(obj_isi.roles)).toString("base64");
        let lsrole=[payload.roles[0].role];
        /*VL O_DAY start
		TODO check */
		/*FS 11-11-2025 */
		  url_dservice = util.getServiceUrl("dservice") + '/api/v1/perm/permbyroles';
        let response_perm = await axios.get(url_dservice, { params: { role: lsrole } })
        let listprm_value= new Buffer(JSON.stringify( response_perm.data.data)).toString("base64");
         
         //  let listprm_value= "e30=";//TODO check: temporarily hardcoded cause service does not work

        /*let loggedUserRoles = payload.roles || [];
        let lsrole = [loggedUserRoles[0].role]
        console.log("lsrole ", lsrole);

        let response_perm = await axios.get(url_dservice, {params: {role: lsrole}})
        let listprm_value = new Buffer(JSON.stringify(response_perm.data.data)).toString("base64");
        VL O_DAY END*/

		//TODO check access_token cause cookie does samesite none not work
        var objtoSend = {"csrfToken": csrfToken, "access_token": token, "DYMisi": base64DYMisi, "d_rl": dr_value, "d_lp":listprm_value}
        //var objtoSend = {"csrfToken": csrfToken, "access_token": token, "refresh_token": refreshToken,  "DYMisi": base64DYMisi, "d_rl": dr_value, "d_lp":listprm_value}//TODO refresh_token
        res.send(objtoSend);

    } catch (error) {
        console.log("ERROR " + nameFile + " | login | Server Error in login ", error);
        res.status(error.response
            ? error.response.status
            : 500 // Default to 500 if no response from server
        ).json({
            message: "Server Error",
            details: error.response.data,
        });
    }
})

router.post("/email", async function (req, res) {
    let dymtoken = req.body.info;
    console.log(nameFile + " | email | ");
    //console.log(nameFile + ' | dymtoken: ', dymtoken);
    //try {
        if (dymtoken != undefined) {

            if (util.isCrypted(dymtoken)) {
                //console.log(nameFile + ' | email | DYM is decrypted by AES alg ');
                let dymtokenDecryptedLfr = util.decryptLfr(process.env.ENCRYPTION_SECRET_KEY, dymtoken);
                //console.log(nameFile + ' | email | DYM decrypted: ', dymtokenDecryptedLfr);
                dymtoken = new Buffer(dymtokenDecryptedLfr).toString("base64");
                //console.log(nameFile + ' | email | DYM coded in base64: ', dymtoken);
            }
        }

        let objtoSend = { "info": "test@liferay.com"}
        res.send(objtoSend);

   /* } catch (error) {
        console.log("Server Error in login ", error);
        res.status(error.response.status).json({
            message: "Server Error",
            details: error.response.data,
        });
    }*/
})


// AC - MG - VL jwt END

// AC - VL jwt START
router.get('/auth-check', util.checkIsDymerAdmin, (req, res) => {
    console.log(nameFile + ' auth-check | Authenticated');
    res.send("Authenticated");
});
// AC - VL jwt END

//TODO delete this endpoint in authenticate.js and in swagger.json and
// add login into swagger.json
/*
router.post('/authenticate',async function (req, res) {
    console.log(nameFile + " | authenticate | ");
    var username = req.body.username;
    //var username = req.body.email; per react ///req.body.username;//VL
    var password = req.body.password;
    console.log(nameFile + " | authenticate | username ", username);
    //console.log(nameFile + " | authenticate | password ", password);

    var _username = global.configService['adminUser'];
    var _password = global.configService['adminPass'];
    // var _users = global.configService['users'] || [];
    var url_dservice = util.getServiceUrl("dservice") + '/api/v1/duser/checklogin'; // Get micro-service endpoint

    //console.log(nameFile + " | authenticate | url_dservice ", url_dservice);

    // let listuser= await axios.get(url_dservice, {  })
    //_users=listuser.data.data;

    // console.log("listuser",listuser.data);
    // console.log(_users);
    var loggedUser = {
        isGravatarEnabled: false,
        authorization_decision: '',
        roles: undefined,
        app_azf_domain: '',
        id: '',
        gid: 0,
        app_id: 'dymer',
        email: '',
        username: ''
    };
    // user = _users.find(usr => usr.email === username && usr.password === password );
    // if ((!user) && (username !== _username || password !== _password)) {

    if (username === _username && password === _password) {
        loggedUser.roles = [{ role: 'app-admin' }]
        loggedUser.id = 'admin@dymer.it'
        loggedUser.email = 'admin@dymer.it'
        loggedUser.username = 'admin@dymer.it'

    }else{
        let checklogin = await axios.post(url_dservice, { "email": username,"password":password })
        if(checklogin.data.data.length ==0){
            console.error('Error: Wrong login');
            res.status(401);
            res.send('Wrong login');
            return;
        }else{
            user=checklogin.data.data[0]
            loggedUser.roles = user.roles
            loggedUser.id = user.email
            loggedUser.email = user.email
            loggedUser.username = user.username
        }
    }
    var obj_isi = {};
    obj_isi.roles = loggedUser.roles;
    let base64DYM = new Buffer(JSON.stringify(loggedUser)).toString("base64")
    let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64")
    let dr_value = new Buffer(JSON.stringify(obj_isi.roles)).toString("base64");
    var url_dservice = util.getServiceUrl("dservice") + '/api/v1/perm/permbyroles'; // Get micro-service endpoint
    console.log(' loggedUser.roles', loggedUser.roles);
    let lsrole=[]
    loggedUser.roles.forEach(element => {
        lsrole.push(element.role)
    });
    let response_perm = await axios.get(url_dservice, { params: { role: lsrole } })
    //console.log('response_perm', response_perm.data);

    let listprm_value= new Buffer(JSON.stringify( response_perm.data.data)).toString("base64");

    var objtoSend = {"DYM": base64DYM, "DYMisi": base64DYMisi, "d_rl": dr_value,"user": loggedUser, "d_lp": listprm_value}

    res.send(objtoSend);

    return;
});*/

//TODO refresh_token
/*const jwt = require("jsonwebtoken");
router.post('/auth/refresh', async (req, res) => {
    //let refresh_token = req.body.refresh_token;
    //console.log(nameFile + " | auth/refresh | refresh_token ",refresh_token);


    let refresh_token = req.body.refresh_token;
    console.log(nameFile + "| auth/refresh | refresh_token " + req.body.refresh_token );
    const secretKey = process.env.JWT_SECRET_KEY
    const encryptKey = process.env.ENCRYPTION_SECRET_KEY
    const refreshSecretKey = process.env.ENCRYPTION_SECRET_KEY//REFRESH_SECRET_KEY

    if (!refresh_token) {
        console.log(nameFile + ' | auth/refresh | refresh_token: '+ refresh_token);
        return res.status(401).send('Refresh token empty!');
    }

    jwt.verify(refresh_token, refreshSecretKey, (err, decodedPayload) => {
        if (err) {
            console.log(nameFile +' | auth/refresh | Refresh token expired or invalid: ', err);
            return res.status(403).send('Refresh token expired or invalid');
        }
        console.log(nameFile +' | auth/refresh | decodedRefreshToken: ', decodedPayload);
        DymerUser.findOne({ refreshToken: refresh_token }).then(el => {
            console.log(nameFile +' | auth/refresh | el: ', el);
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

            let loggedUser = {};
            var obj_isi = {};

            const decodedString = Buffer.from(token.split('.')[1], 'base64').toString('utf-8');
            let payload = util.getDecryptedPayload(token)

            obj_isi.roles = payload.roles;
            let base64DYMisi = new Buffer(JSON.stringify(obj_isi)).toString("base64")
            let dr_value = new Buffer(JSON.stringify(obj_isi.roles)).toString("base64");
            let listprm_value= "e30=";

            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'None',
            });

            el.save((err) => {
                if (err) {
                    //return res.status(500).send('Error saving tokens');
                }
                //return res.json({token: newToken, refreshToken: newRefreshToken, csrfToken: newCsrfToken});
            });

            var objtoSend = {"csrfToken": csrfToken, "access_token": token, "refresh_token": refreshToken,  "DYMisi": base64DYMisi, "d_rl": dr_value, "d_lp":listprm_value}
            console.log(nameFile + ' | /auth/refresh | auth/refresh objtoSend:', objtoSend);

            return objtoSend;
        });
    });


   
});*/
module.exports = router;