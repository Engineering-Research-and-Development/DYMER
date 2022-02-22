var jsonResponse = require('../jsonResponse');
var express = require('express');

var router = express.Router();
const util = require("../utility");
const axios = require('axios');
const bodyParser = require("body-parser");
const { response } = require('express');

const rrmApi = process.env.RRM_API || 'https://deh-demeter.eng.it/pep-proxy';
const acsServer = process.env.ACS_SERVER || 'https://acs.bse.h2020-demeter-cloud.eu:3030';

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: false,
    limit: '100MB'
}));

router.get('/', (req, res) => {

    var ret = new jsonResponse();
    let authToken = req.headers['x-subject-token']
    var url_dservice = util.getServiceUrl("dservice");
    var ownerUrl = url_dservice + "/api/v1/sessions/findByAccessToken/" + authToken;

    axios.get(ownerUrl).then(session => {
        console.log("SESIJA1", session.data)
        if (session.data.data[0] != null) {
            if (session.data.data[0].session.extraData != undefined) {
                if (session.data.data[0].session.extraData.getAllMetricsCapToken != undefined) {
                    const getAllMetricsCapToken = JSON.parse(session.data.data[0].session.extraData.getAllMetricsCapToken);
                    getMetricsFromRRM('', authToken, getAllMetricsCapToken).then(function (callresp) {

                        ret.setSuccess(callresp.data.success);
                        ret.setData(callresp.data.data);
                        if (!ret.success) {
                            ret.setMessages(callresp.data.extraData.message)
                            ret.setExtraData(callresp.data.extraData)
                        } else {
                            ret.setMessages(callresp.data.message);
                        }
                        return res.send(ret);

                    }).catch(function (error) {
                        console.log(error);
                        ret.setSuccess(false);
                        ret.setMessages("Get all user Metrics Problem");
                        return res.send(ret);

                    });

                }
                else {
                    getMetricsCapabilityToken('', authToken).then(function (tokenResponse) {
                        getMetricsFromRRM('', authToken, tokenResponse.data).then(function (callresp) {

                            ret.setSuccess(callresp.data.success);
                            ret.setData(callresp.data.data);
                            if (!ret.success) {
                                ret.setMessages(callresp.data.extraData.message)
                                ret.setExtraData(callresp.data.extraData)
                            } else {
                                ret.setMessages(callresp.data.message);
                            }
                            return res.send(ret);

                        }).catch(function (error) {
                            console.log(error);
                            ret.setSuccess(false);
                            ret.setMessages("Get all user Metrics Problem");
                            return res.send(ret);

                        });
                    }).catch(function (error) {
                        console.log(error);
                        ret.setSuccess(false);
                        ret.setMessages("Get all user Metrics Problem");
                        return res.send(ret);

                    });
                }
            }
        } else {
            getMetricsCapabilityToken('', authToken).then(function (tokenResponse) {
                getMetricsFromRRM('', authToken, tokenResponse.data).then(function (callresp) {

                    ret.setSuccess(callresp.data.success);
                    ret.setData(callresp.data.data);
                    if (!ret.success) {
                        ret.setMessages(callresp.data.extraData.message)
                        ret.setExtraData(callresp.data.extraData)
                    } else {
                        ret.setMessages(callresp.data.message);
                    }
                    return res.send(ret);

                }).catch(function (error) {
                    console.log(error);
                    ret.setSuccess(false);
                    ret.setMessages("Get all user Metrics Problem");
                    return res.send(ret);

                });
            }).catch(function (error) {
                console.log(error);
                ret.setSuccess(false);
                ret.setMessages("Get all user Metrics Problem");
                return res.send(ret);

            });
        }

    }).catch(function (error) {
        // handle error
        console.error("GET external error", error);
        reject("ERROR:" + ownerUrl + " external error=" + error)
    });
});

router.get('/containerid/:id', (req, res) => {

    var ret = new jsonResponse();
    let authToken = req.headers['x-subject-token']
    let url = '/containerId/' + req.params.id;

    getMetricsCapabilityToken(url, authToken).then(function (response) {
        getMetricsFromRRM(url, authToken, response.data).then(function (callresp) {

            ret.setSuccess(callresp.data.success);
            ret.setData(callresp.data.data);
            if (!ret.success) {
                ret.setMessages(callresp.data.extraData.message)
                ret.setExtraData(callresp.data.extraData)
            } else {
                ret.setMessages(callresp.data.message);
            }
            return res.send(ret);

        }).catch(function (error) {
            console.log(error);
            ret.setSuccess(false);
            ret.setMessages("Get Container Metrics Problem");
            return res.send(ret);

        });
    })

});

router.get('/rrmid/:id', (req, res) => {

    var ret = new jsonResponse();
    let authToken = req.headers['x-subject-token']
    let url = '/rrmId/' + req.params.id + '?deh=true';

    getMetricsCapabilityToken(url, authToken).then(function (response) {
        getMetricsFromRRM(url, authToken, response.data).then(function (callresp) {

            ret.setSuccess(callresp.data.success);
            ret.setData(callresp.data.data);
            if (!ret.success) {
                ret.setMessages(callresp.data.extraData.message)
                ret.setExtraData(callresp.data.extraData)
            } else {
                ret.setMessages(callresp.data.message);
            }
            return res.send(ret);

        }).catch(function (error) {
            console.log(error);
            ret.setSuccess(false);
            ret.setMessages("Get DEH Resource Metrics Problem");
            return res.send(ret);

        });
    })

});

//This is path, this MUST be fixed in next release
router.post('/getCapToken',

    async function (req, res) {

        console.log("ENVV RRM API", process.env.RRM_API);
        console.log("ENVV RRM ACS", process.env.ACS_SERVER);

        var ret = new jsonResponse();
        ret.setSuccess(false);
        console.log('Attachment Request received');
        let body = req.body;
        console.log("REQ Body", body);

        getCapabilityTokenAttachment(body.accessToken).then(function (tokenResponse) {
            const buff = Buffer.from(JSON.stringify(tokenResponse.data), 'utf-8');
            const base64AttachmentToken = buff.toString('base64');
            ret.setSuccess(true);
            ret.setMessages("Attachment Cap. Token Fetched");
            let response = { token: base64AttachmentToken }
            ret.setData(response);
            return res.send(ret);

        }).catch(function (error) {
            console.log(error);
            ret.setSuccess(false);
            ret.setMessages("Attachment Cap. Token Problem");
            return res.send(ret);
        });
    });



//This is path, this MUST be fixed in next release
const getMetricsFromRRM = (url, authToken, capToken) => {


    const headers = {
        'Content-Type': 'application/json',
        'x-subject-token': authToken,
        'x-auth-token': JSON.stringify(capToken)
    };

    let metricsApi = '/api/v1/metrics'

    let serverUrl = rrmApi + metricsApi + url;
    console.log("HEADERSS", headers)
    console.log("GET PEP Galled ", serverUrl)

    return new Promise((resolve, reject) => {

        axios.get(serverUrl, { headers: headers }).then(resp => {
            console.log("GET external ok", resp.stats);
            resolve(resp);
        }).catch(function (error) {
            // handle error
            console.error("GET external error", error.response.status);
            reject("ERROR:" + error.response.status)
        });
    })
}

const getCapabilityTokenAttachment = (accessToken) => {
    return new Promise((resolve, reject) => {

        const postHeaders = {
            'Content-Type': 'application/json',
        };

        axios.post(acsServer, `{"token":"${accessToken}","ac":"GET","de":"${rrmApi}","re":"/api/v1/attachment/.*"}`, postHeaders).then(resp => {

            resolve(resp);
        }).catch(function (error) {
            // handle error
            console.log(error);
            reject("ERROR:" + " external error=" + error.response.status)
        });
    })
};



const getMetricsCapabilityToken = (url, authToken) => {
    return new Promise((resolve, reject) => {

        let config = {
            headers: {
                'Content-Type': 'application/json',
            }
        }

        let rawBody = {
            token: authToken,
            ac: "GET",
            de: rrmApi,
            re: "/api/v1/metrics" + url
        }

        let body = JSON.stringify(rawBody);

        axios.post(acsServer, body, config).then(resp => {
            console.log("CAP Token response: ", resp)
            resolve(resp);
        }).catch(function (error) {
            // handle error
            console.log(error);
            reject("ERROR: Getting Metrics Cap. Token external error=" + error.response.status)
        });
    })
};

module.exports = router;