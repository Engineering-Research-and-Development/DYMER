const axios = require('axios');
var express = require('express');

exports.getUserInfo = async function(myheader) {
    console.log("==>getUserInfo");
    return new Promise((resolve, reject) => {
        console.log("titit", myheader["dymertoken"]);
        var headers = {
            'Content-Type': 'multipart/form-data'
        };
        var postObj = {
            'token': myheader["dymertoken"]

        };
        console.log("postObj", postObj);
        //TODO check post url
        axios.post('http://localhost:8080/api/auth/userinfo', postObj).then(function(response) {
                console.log("==>getUserInfo1");
                console.log("FATTO");
                console.log(response.data.data);
                // return response.data.data;
                resolve(response.data.data);
            })
            .catch(function(error) {
                console.log("==>getUserInfo2");
                console.log("ORRORE");
                console.error("ERROR | " + "status:" + error.response.status);
            });



    });
};