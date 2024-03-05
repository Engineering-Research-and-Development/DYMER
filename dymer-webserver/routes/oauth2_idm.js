const querystring = require('querystring');
const https = require('https');
const http = require('http');
const URL = require('url');

exports.OAuth2 = function (clientId, clientSecret, baseSite, internalSite, authorizePath, accessTokenPath, callbackURL, customHeaders, xtokenURL) {
	this._clientId = clientId;
	this._clientSecret = clientSecret;
	this._baseSite = baseSite;
	this._internalSite = internalSite;

	this._authorizeUrl = authorizePath || "/oauth/authorize";
	this._accessTokenUrl = accessTokenPath || "/oauth/access_token";
	this._callbackURL = callbackURL;
	this._accessTokenName = "access_token";
	this._authMethod = "Basic";
	this._customHeaders = customHeaders || {};
	this._xtokenURL = xtokenURL || "/v1/auth/tokens";
	this._revokeUrl = global.gConfig.services.webserver.idm.revokeUrl || "";
}

// This 'hack' method is required for sites that don't use
// 'access_token' as the name of the access token (for requests).
// ( http://tools.ietf.org/html/draft-ietf-oauth-v2-16#section-7 )
// it isn't clear what the correct value should be atm, so allowing
// for specific (temporary?) override for now.
exports.OAuth2.prototype.setAccessTokenName = function (name) {
	this._accessTokenName = name;
}

exports.OAuth2.prototype._getAccessTokenUrl = function (internal) {
	return ((internal) ? this._internalSite : this._baseSite) + this._accessTokenUrl;
	//return this._baseSite + '/v1/auth/tokens';
}
exports.OAuth2.prototype._getAccessTokenUrlX = function (internal) {
	return ((internal) ? this._internalSite : this._baseSite) + this._xtokenURL;
}
exports.OAuth2.prototype._getBaseUrl = function (internal) {
	return ((internal) ? this._internalSite : this._baseSite);
}
exports.OAuth2.prototype._getRevokeTokenUrl = function (internal) {
	return ((internal) ? this._internalSite : this._baseSite) + this._revokeUrl;
	//  return this._baseSite + '/auth/tokens';
}
// Build the authorization header. In particular, build the part after the colon.
// e.g. Authorization: Bearer <token>  # Build "Bearer <token>"
exports.OAuth2.prototype.buildAuthHeader = function () {
	const key = this._clientId + ':' + this._clientSecret;
	const base64 = (new Buffer(key)).toString('base64');
	return this._authMethod + ' ' + base64;
};

exports.OAuth2.prototype._request = function (method, url, headers, postBody, accessToken, callback) {

	let httpLibrary = https;
	const parsedUrl = URL.parse(url, true);
	if (parsedUrl.protocol === "https:" && !parsedUrl.port) {
		parsedUrl.port = 443;
	}

	// As this is OAUth2, we *assume* https unless told explicitly otherwise.
	if (parsedUrl.protocol !== "https:") {
		httpLibrary = http;
	}

	const realHeaders = {};
	for (const key in this._customHeaders) {
		realHeaders[key] = this._customHeaders[key];
	}
	if (headers) {
		for (const key in headers) {
			realHeaders[key] = headers[key];
		}
	}
	realHeaders.Host = parsedUrl.host;

	//realHeaders['Content-Length']= postBody ? Buffer.byteLength(postBody) : 0;
	if (accessToken && !('Authorization' in realHeaders)) {
		if (!parsedUrl.query) {
			parsedUrl.query = {};
		}
		parsedUrl.query[this._accessTokenName] = accessToken;
	}

	let queryStr = querystring.stringify(parsedUrl.query);
	if (queryStr) {
		queryStr = "?" + queryStr;
	}
	const options = {
		host:    parsedUrl.hostname,
		port:    parsedUrl.port,
		path:    parsedUrl.pathname + queryStr,
		method,
		headers: realHeaders
	};
	console.log('options', options);
	this._executeRequest(httpLibrary, options, postBody, callback);
}

exports.OAuth2.prototype._executeRequest = function (httpLibrary, options, postBody, callback) {
	// Some hosts *cough* google appear to close the connection early / send no content-length header
	// allow this behaviour.
	const allowEarlyClose = options.host && options.host.match(".*google(apis)?.com$");
	let callbackCalled = false;

	function passBackControl(response, result, err) {
		// console.log('response, result, err', response);
		if (!callbackCalled) {
			callbackCalled = true;
			if (response.statusCode !== 200 && response.statusCode !== 201 && (response.statusCode !== 301) && (response.statusCode !== 302)) {
				callback({statusCode: response.statusCode, data: result, resheader: response});
			} else {
				callback(err, result, response);
			}
		}
	}

	let result = "";

	const request = httpLibrary.request(options, function (response) {
		response.on("data", function (chunk) {
			result += chunk
		});
		response.on("close", function (err) {
			if (allowEarlyClose) {
				passBackControl(response, result, err);
			}
		});
		response.addListener("end", function () {
			passBackControl(response, result);
		});
	});
	request.on('error', function (e) {
		callbackCalled = true;
		callback(e);
	});

	if (options.method === 'POST' && postBody) {
		request.write(postBody);
	}
	request.end();
}

exports.OAuth2.prototype.getAuthorizeUrl = function (responseType) {

	responseType = responseType || 'code';

	return this._baseSite + this._authorizeUrl + '?response_type=' + responseType + '&client_id=' + this._clientId + '&state=xyz&redirect_uri=' + this._callbackURL;

}

function getResults(data) {
	let results;
	try {
		results = JSON.parse(data);
	} catch (e) {
		results = querystring.parse(data);
	}
	return results;
}

exports.OAuth2.prototype.getOAuthAccessToken = function (code) {
	const that = this;

	return new Promise((resolve, reject) => {
		const postData = 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + that._callbackURL;

		const postHeaders = {
			'Authorization':  that.buildAuthHeader(),
			'Content-Type':   'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		};

		that._request("POST", that._getAccessTokenUrl(), postHeaders, postData, null, (error, data) => {
			return error ? reject(error) : resolve(getResults(data));
		});
	});
}
exports.OAuth2.prototype.getOAuthAccessToken2 = function (code) {
	const that = this;

	return new Promise((resolve, reject) => {
		const postData = 'grant_type=authorization_code&code=' + code + '&redirect_uri=' + that._callbackURL;

		const postHeaders = {
			'Content-Type': 'application/json'
		};

		that._request("POST", that._getAccessTokenUrl(), postHeaders, postData, null, (error, data) => {
			return error ? reject(error) : resolve(getResults(data));
		});
	});
}


exports.OAuth2.prototype.getOAuthClientCredentials = function () {
	const that = this;
	return new Promise((resolve, reject) => {
		const postData = 'grant_type=client_credentials';
		const postHeaders = {
			'Authorization':  that.buildAuthHeader(),
			'Content-Type':   'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		};

		that._request("POST", that._getAccessTokenUrl(), postHeaders, postData, null, (error, data) => {
			return error ? reject(error) : resolve(getResults(data));
		});
	});
}
/**********funzioni testate */
//login user generico e ritorna access_token e refresh_token /oauth2/token
exports.OAuth2.prototype.getOAuthPasswordCredentialsUser = function (username, password) {
	const that = this;
	return new Promise((resolve, reject) => {
		const postData = 'grant_type=password&username=' + username + '&password=' + password;
		const postHeaders = {
			'Authorization':  that.buildAuthHeader(),
			'Content-Type':   'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		};
		that._request("POST", that._getAccessTokenUrl(), postHeaders, postData, null, (error, data, resheader) => {
			if (error)
				reject(error);
			resolve(getResults(data));
			// return error ? reject(error) : resolve(getResults(data));
		});
	});
}
//ritorna tutte le informazioni di un utente
exports.OAuth2.prototype.getUserInfoByToken = function (accessToken) {

	return new Promise((resolve, reject) => {
		const that = this;
		that._request("GET", that._getBaseUrl() + "/user", {}, "", accessToken, (error, data) => {
			return error ? reject(error) : resolve(data);
		});
	});
} //ritorna tutti i dettagli di un utente
exports.OAuth2.prototype.getUserDetailInfoByToken = function (accessToken) {
	const that = this;
	return new Promise((resolve, reject) => {
		that.getUserInfoByToken(accessToken).then(function (userDet) {
			console.log('userDet', userDet);
			var uInfo = JSON.parse(userDet);
			const postHeaders = {
				'Authorization': that.buildAuthHeader(),
				'X-Auth-token':  'ADMIN',
				'Content-Type':  'application/json',
			};
			that._request("GET", that._getBaseUrl(true) + "/v3/users/" + uInfo.id, postHeaders, "", null, (error, data) => {
				var uData = JSON.parse(data);
				// console.log('datavv', uData.user);

				uData.user.email = uInfo.email;
				var dtRet = JSON.stringify(uData);
				return error ? reject(error) : resolve(dtRet);
			});
		}).catch(function (err) {

			return reject(err);
		});
	});


}
exports.OAuth2.prototype.logoutfromToken = function (token) {
	const that = this;
	return new Promise((resolve, reject) => {
		const postData = 'token=' + token;
		const postHeaders = {
			'Authorization':  that.buildAuthHeader(),
			'Content-Type':   'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		};
		/*   const postHeaders = {
			   'X-Auth-token': token,
			   'Content-Type': 'application/json',
			   'X-Subject-token': token
		   }*/

		var logoutUrl = that._getRevokeTokenUrl();
		if (logoutUrl != "") {
			//    that._request("DELETE", that._getRevokeTokenUrl(), postHeaders,null, null, (error, data) => {
			that._request("POST", that._getRevokeTokenUrl(), postHeaders, postData, null, (error, data) => {
				console.log('POST logoutfromToken data', data);
				console.log('POST logoutfromToken error', error);
				if (error)
					reject(error);
				resolve(getResults(data));
				// return error ? reject(error) : resolve(getResults(data));
			});
		} else {
			resolve();
		}
	});
}
/**********FINE funzioni testate */
//invalid permission
exports.OAuth2.prototype.refreshToken = function (token) {
	const that = this;
	return new Promise((resolve, reject) => {
		const postData = 'grant_type=refresh_token&refresh_token=' + token;
		const postHeaders = {
			'Authorization':  that.buildAuthHeader(),
			'Content-Type':   'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		};
		console.log('postData', postData);
		that._request("POST", that._getAccessTokenUrl(), postHeaders, postData, null, (error, data) => {
			if (error)
				reject(error);
			resolve(getResults(data));
			// return error ? reject(error) : resolve(getResults(data));
		});

	});
}
exports.OAuth2.prototype.getTokenInfo = function (accessToken) {
	const that = this;
	const postHeaders = {
		'X-Auth-token':    accessToken,
		'X-Subject-token': accessToken
	};
	return new Promise((resolve, reject) => {
		that._request("GET", that._getBaseUrl() + "/v1/auth/tokens", postHeaders, "", "", (error, data) => {
			//that._request("GET", that._getBaseUrl() + "v1/auth/tokens", postHeaders, "", accessToken, (error, data) => {
			return error ? reject(error) : resolve(data);
		});
	});
}
/*
	exports.OAuth2.prototype.getOAuthPasswordCredentials = function(username, password) {
		const that = this;
		return new Promise((resolve, reject) => {
			// const postData = "{  \"name\":" + username + ",  \"password\":" + password + "}";
			const postData = JSON.stringify({ 'name': username, 'password': password });
			const postHeaders = {
	aaaaaaa
				'Content-Type': 'application/json'
			};

			that._request("POST", that._getAccessTokenUrlLogin(), postHeaders, postData, null, (error, data, resheader) => {
				console.log('resheader', resheader.headers);
				console.log('POST error', error);
				data
				console.log('that._getAccessTokenUrlLogin()', that._getAccessTokenUrlLogin());
				if (error)
					reject(error);
				resolve(getResults(data));
				// return error ? reject(error) : resolve(getResults(data));
			});
		});
	}

	exports.OAuth2.prototype.ckeckvalidToken = function(token) {
		const that = this;
		return new Promise((resolve, reject) => {
			const postData = 'token=' + token + '&token_type_hint=access_token';
			const postHeaders = {
				'Authorization': that.buildAuthHeader(),
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postData.length,
			};

			that._request("POST", that._baseSite(), postHeaders, postData, null, (error, data) => {
				console.log('POST logoutfromToken data', data);
				console.log('POST logoutfromToken error', error);
				if (error)
					reject(error);
				resolve(getResults(data));
				// return error ? reject(error) : resolve(getResults(data));
			});
		});
	}


	exports.OAuth2.prototype.getUserInfoByAdmin = function(url, accessToken, uid) {
		const that = this;
		const postHeaders = {
			'X-Auth-token': accessToken,
			'Content-Type': 'application/json'
		};
		return new Promise((resolve, reject) => {
			that._request("GET", that._getBaseUrl() + url + uid, postHeaders, "", null, (error, data) => {
				return error ? reject(error) : resolve(data);
			});
		});
	}
	exports.OAuth2.prototype.getTestInfo = function(url, accessToken) {
		const that = this;
		return new Promise((resolve, reject) => {
			const postHeaders = {

				'X-Auth-token': accessToken
			};
			console.log('invovo', that._getBaseUrl() + url);
			that._request("GET", that._getBaseUrl() + url, postHeaders, "", null, (error, data) => {
				return error ? reject(error) : resolve(data);
			});
		});
		var rr = oa.getAuthorizeUrl();
	}*/

exports.OAuth2.prototype.get = function (url, accessToken) {
	const that = this;
	return new Promise((resolve, reject) => {
		that._request("GET", url, {}, "", accessToken, (error, data) => {
			return error ? reject(error) : resolve(data);
		});
	});
}