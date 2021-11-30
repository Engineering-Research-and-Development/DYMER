const axios = require('axios');
var express = require('express');

exports.getUserInfo = async function(myheader) {

    return new Promise((resolve, reject) => {
        console.log("titit", myheader["dymertoken"]);
        //  myheader["sasa"] = 2;
        //objSend = resp.hits.hits[0];
        var headers = {
            'Content-Type': 'multipart/form-data'
        };
        var postObj = {
            'token': myheader["dymertoken"]

        };
        console.log("postObj", postObj);
        axios.post('http://localhost:8080/api/auth/userinfo', postObj).then(function(response) {
                console.log("FATTO");
                console.log(response.data.data);
                // return response.data.data;
                resolve(response.data.data);
            })
            .catch(function(error) {
                console.log("ORRORE");
                console.error("ERROR | " + "status:" + error.response.status);

                // resolve(myheader);
                // console.log(error);
            });



    });
};