class DymerOauth {
    constructor(obj) {
        this.storage = "cookie";
        this.logintype = undefined; //"dymer";
        this.exdays = 1;
        this.key = "doauthtoken";
        this.keyRefresh = "doauthrefreshtoken";
        this.isLogged = false;
        this.baseuri = "";
        this.loginurl = "";
        this.logouturl = "";
        this.userData = {};
        if (obj == undefined) {
            obj = {};
        }
        this.setconfig(obj);

    }
    setuserData(key, obj) { this.userData[key] = obj; }
    getuserData() { return this.userData; }
    adduserDataParam(key, obj) { this.userData[key] = obj; }
    removeuserDataParam(key) { delete this.userData[key]; }
    setstorage(storage) { this.storage = storage; }
    getstorage() { return this.storage; }
    setlogintype(logintype) { this.logintype = logintype; }
    getlogintype() { return this.logintype; }
    setexdays(exdays) { this.exdays = exdays; }
    getexdays() { return this.exdays; }
    setkey(key) { this.key = key; }
    getkey() { return this.key; }
    setRefreshkey(key) { this.keyRefresh = key; }
    getRefreshkey() { return this.keyRefresh; }
    setIsLogged(isLogged) { this.isLogged = isLogged; }
    getIsLogged() { return this.isLogged; }
    setbaseuri(baseuri) { this.baseuri = baseuri; }
    getbaseuri() { return this.baseuri; }
    setLoginUrl(loginurl) { this.loginurl = loginurl; }
    getLoginUrl() { return this.loginurl; }
    setLogoutUrl(logouturl) { this.logouturl = logouturl; }
    getLogoutUrl() { return this.logouturl; }
    getToken() {
        var self_ = this;
        var key = self_.getkey();
        switch (self_.getstorage()) {
            case "local":
                return self_.getVarLocal(key);
                break;
            case "session":
                return self_.getVarSession(key);
                break;
            case "cookie":
                return self_.getVarCookie(key);
                break;
            default:
                return self_.getVarLocal(key);
        }
    }
    setToken(val) {
        var self_ = this;
        var key = self_.getkey();
        var days = self_.getexdays();
        switch (self_.getstorage()) {
            case "local":
                return self_.setVarLocal(key, val);
                break;
            case "session":
                return self_.setVarSession(key, val);
                break;
            case "cookie":

                return self_.setVarCookie(key, val, days);
                break;
            default:
                return self_.setVarLocal(key, val);
        }
    }
    getRefreshToken() {
        var self_ = this;
        var key = self_.getRefreshkey();
        switch (self_.getstorage()) {
            case "local":
                return self_.getVarLocal(key);
                break;
            case "session":
                return self_.getVarSession(key);
                break;
            case "cookie":
                return self_.getVarCookie(key);
                break;
            default:
                return self_.getVarLocal(key);
        }
    }
    setRefreshToken(val) {
        var self_ = this;
        var key = self_.getRefreshkey();
        var days = self_.getexdays();
        switch (self_.getstorage()) {
            case "local":
                return self_.setVarLocal(key, val);
                break;
            case "session":
                return self_.setVarSession(key, val);
                break;
            case "cookie":

                return self_.setVarCookie(key, val, days);
                break;
            default:
                return self_.setVarLocal(key, val);
        }
    }
    removeToken() {
        var self_ = this;
        var key = self_.getkey();
        var keyrefresh = self_.getRefreshkey();
        switch (self_.getstorage()) {
            case "local":
                self_.removeVarLocal(key);
                self_.removeVarLocal(keyrefresh);
                break;
            case "session":
                self_.removeVarSession(key);
                self_.removeVarSession(keyrefresh);
                break;
            case "cookie":
                self_.removeVarCookie(key);
                self_.removeVarCookie(keyrefresh);
                break;
            default:
                self_.removeVarLocal(key);
                self_.removeVarLocal(keyrefresh);
                break;
        }
    }
    generateBtn() {
        var loginDymerButton = '<div id="DymerMenuUser" >';
        loginDymerButton += '<i id="loginDymerBtn" title="Login" style="display: none;" class="fa fa-user-o" aria-hidden="true" onclick="dymerOauth.generateModal(\'login\')"></i>';
        loginDymerButton += '<label id="menuDymerBtn" for="userDymermenu_checkbox" class="  grp_userDymermenu" style="display: none;"><i  class="fa fa-user-circle  "  aria-hidden="true" ></i></label>';


        loginDymerButton += ' <input    type="checkbox"  style="display: none;" id="userDymermenu_checkbox">';
        loginDymerButton += '<div id="userDymerLogged"><i id="userDymerInfo" onclick="dymerOauth.actionUserInfo()" title="Idm Profile" class="fa fa-address-card-o" aria-hidden="true"></i>' +
            '<i id="userDymerLogout" class="fa fa-sign-out"  title="Logout"  aria-hidden="true" onclick="dymerOauth.generateModal(\'logout\')"></i>'
        '</div>';
        loginDymerButton += ' </div>';
        $('body').append(loginDymerButton);
        this.activateBtn();
    }
    run() {

        if (this.getToken() != null) {
            this.setIsLogged(true);
            this.generateBtn();
        }
        if (this.getlogintype() == "dymer")
            this.generateBtn();
    }
    activateBtn() {
        var self_ = this;
        if (self_.getIsLogged()) {
            $('.grp_userDymermenu').show();
            $('#loginDymerBtn').hide();
            $('#userDymermenu_checkbox')[0].checked = false;
        } else {
            $('.grp_userDymermenu').hide();
            $('#loginDymerBtn').show();
            $('#userDymermenu_checkbox')[0].checked = false;
        }
    }
    actionLoginOutDymer(act) {
        var self_ = this;
        if (act) {
            var loginData = {
                // grant_type: 'password',
                username: $('#dymerLoginOut [name="username"]').val(),
                password: $('#dymerLoginOut [name="password"]').val(),
            };
            $.ajax({
                type: 'POST',
                url: self_.getLoginUrl(),
                data: loginData
            }).done(function(ret) {
                useAlert('#dymerLoginOut', "", ret.message, ret.success);
                console.log('Login and data user', ret);
                if (ret.success) {
                    setTimeout(function() {
                        $('#dymerLoginOut').modal('hide');
                    }, 2000);
                    self_.setIsLogged(true);
                    if (self_.getstorage() == "cookie")
                        self_.setexdays(ret.data.expires_in);
                    self_.setToken(ret.data.access_token);
                    self_.setRefreshToken(ret.data.refresh_token);
                    self_.activateBtn();
                }

            }).fail(function(jqXHR, textStatus, errorThrown) {
                useAlert('#dymerLoginOut', "", "Error oaut", false);
            });
        } else {
            //try logout and remone token
            var logoutData = {
                token: this.getToken(),
            };
            console.log('logoutData', logoutData);
            $.ajax({
                type: 'POST',
                url: self_.getLogoutUrl(),
                data: logoutData,
                datatype: 'json',
            }).done(function(ret) {

                console.log('Logout info', ret);
                if (ret.success) {
                    useAlert('#dymerLoginOut', "Corrent", ret.message, ret.success);
                    setTimeout(function() {
                        $('#dymerLoginOut').modal('hide');
                    }, 2000);
                    self_.setIsLogged(false);
                    self_.removeToken();
                    self_.activateBtn();
                } else {
                    useAlert('#dymerLoginOut', "Forced", ret.message, ret.success);
                    self_.setIsLogged(false);
                    self_.removeToken();
                    self_.activateBtn();
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                useAlert('#dymerLoginOut', "", "Error oaut", false);
                setTimeout(function() {
                    $('#dymerLoginOut').modal('hide');
                }, 2000);
                self_.setIsLogged(false);
                self_.removeToken();
                self_.activateBtn();
            });
        }
        /* this.activateBtn();
         $('#dymerLoginOut').modal('hide');*/
    }
    actionUserInfo() {
        var self_ = this;
        var userdata = {
            token: this.getToken(),
        };
        $.ajax({
            type: 'POST',
            url: self_.getbaseuri() + '/userinfo',
            data: userdata,
            datatype: 'json',
        }).done(function(ret) {
            console.log('actionUserInfo', ret);
            dymerOauth.generateModal("infouser", ret.data);
            return ret;
        }).fail(function(jqXHR, textStatus, errorThrown) {
            useAlert('#dymerLoginOut', "", "Error oaut", false);
        });
    }
    actionRefreshToken() {
        var self_ = this;
        var userdata = {
            token: this.getRefreshToken(),
        };
        $.ajax({
            type: 'POST',
            url: self_.getbaseuri() + '/refreshtoken',
            data: userdata,
            datatype: 'json',
        }).done(function(ret) {
            console.log('actionrefreshtoken', ret);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            useAlert('#dymerLoginOut', "", "Error refreshtoken", false);
        });
    }





    actionTokenInfo() {
        var self_ = this;
        var userdata = {
            token: this.getToken(),
        };
        $.ajax({
            type: 'POST',
            url: self_.getbaseuri() + '/tokeninfo',
            data: userdata,
            datatype: 'json',
        }).done(function(ret) {
            console.log('actionTokenInfo', ret);
        }).fail(function(jqXHR, textStatus, errorThrown) {
            useAlert('#dymerLoginOut', "", "Error actionTokenInfo", false);
        });
    }
    actionTest() {
        var self_ = this;
        var userdata = {
            token: this.getToken(),
        };
        $.ajax({
            type: 'POST',
            url: self_.getbaseuri() + '/test1',
            data: userdata,
            datatype: 'json',
        }).done(function(ret) {

            console.log('test1 Info', ret);

        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log('error test1 Info', errorThrown);

        });

    }
    actiongetOAuthClientCredentials() {
        var self_ = this;
        var userdata = {
            token: this.getToken(),
        };
        $.ajax({
            type: 'POST',
            url: self_.getbaseuri() + '/getOAuthClientCredentials',
            data: userdata,
            datatype: 'json',
        }).done(function(ret) {

            console.log('test1 Info', ret);

        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.log('error test1 Info', errorThrown);

        });


    }



    generateModal(type, data) {
        var self_ = this;
        $('#dymerLoginOut').remove();
        var modalTitle = "";
        var modalBody = '';
        console.log('modaltype', type);
        var modalBtn = '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
        if (type == 'login') {
            modalTitle = "Login";
            modalBody = '               <div  class="senderForm">' +
                '                   <div class="form-group" >' +
                '                       <label for="username">Username</label>' +
                '                       <input type="text" name="username" class="form-control col-12 span12"  value="" required /> ' +
                '                   </div>' +
                '                   <div class="form-group"  >' +
                '                       <label for="password">Password</label>' +
                '                       <input type="password" name="password"  class="form-control col-12 span12"  required />' +
                '                   </div>' +
                '               </div>';
            modalBtn += '<button type="button" class="btn btn-primary" onclick="dymerOauth.actionLoginOutDymer(' + !self_.isLogged + ')">Confirm</button>';
        }
        if (type == "logout") {
            modalTitle = "Logout";
            modalBody = 'Are you sure you want to logout?';
            modalBtn += '<button type="button" class="btn btn-primary" onclick="dymerOauth.actionLoginOutDymer(' + !self_.isLogged + ')">Confirm</button>';

        }
        if (type == "infouser") {
            modalTitle = "Info User";
            // modalBody = '<div><span><b>Id</b></span> <span>' + data.user.id + '</span> </div>';
            modalBody = '<div><span><b>Id</b></span> <span>test</span> </div>';
            modalBody = '<div><span><b>Email</b></span> <span>' + data.user.email + '</span> </div>';
            modalBody += '<div><span><b>Username</b></span> <span>' + data.user.username + '</span> </div>';
            modalBody += '<div><span><b>Description</b></span> <span>' + data.user.description + '</span> </div>';
            modalBody += '<div><span><b>Name</b></span> <span>' + data.user.name + '</span> </div>';
            modalBody += '<div><span><b>Website</b></span> <a href="' + data.user.website + '" target="_blank">link</a> </div>';
            modalBody += '<div><pre>' + JSON.stringify(data, '",', '\t'); + '</pre></div>';
        }

        //  if (self_.isLogged) {

        //   }
        var dymerLoginOut =
            '<div id="dymerLoginOut"  class="dymermodal modal fade" tabindex="-1" role="dialog"  data-backdrop="static">' +
            '   <div class="modal-dialog" role="document" style="    max-width:390px;">' +
            '       <div class="modal-content">' +
            '           <div class="modal-header">' +
            '               <button type="button" class="close" data-dismiss="modal"  style="float: right;display: block;position: relative;"><span aria-hidden="true">&times;</span></button>' +
            '                   <h4 class="modal-title" style="float: left;position: absolute;    margin-top: 0;">' + modalTitle + '</h4>' +
            '           </div>' +
            '           <div class="modal-body">' +
            modalBody +
            '               <div class="alert alertaction" role="alert" style="display: none;">' +
            '                   <button type="button" class="close" onclick="$(this).closest(\'.alert\').slideUp()">' +
            '                   <span aria-hidden="true">×</span>      </button>' +
            '                   <div class="msg_title"></div>' +
            '                   <div class="msg_txt"></div>' +
            '               </div>' +
            '           </div>' +
            '           <div class="modal-footer">' +
            modalBtn +
            '           </div>' +
            '       </div>' +
            '   </div>' +
            '</div>';

        $('body').append(dymerLoginOut);
        $('#dymerLoginOut').modal('show');
    }
    setVarSession(key, val) { sessionStorage.setItem(key, val); }
    getVarSession(key) { return sessionStorage.getItem(key) }
    removeVarSession(key) { sessionStorage.removeItem(key) }
    setVarLocal(key, val) { localStorage.setItem(key, val); }
    getVarLocal(key) { return localStorage.getItem(key) }
    removeVarLocal(key) { localStorage.removeItem(key) }
    setVarCookie(key, val, exdays) {
        var now = new Date();
        if (exdays != undefined) {
            now.setSeconds(now.getSeconds() + exdays);
            // d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
            /* var time = now.getTime();
             time += exdays; //3600 * 1000; 
             now.setTime(time);*/
            var offset = now.getTimezoneOffset();
            offset = Math.abs(offset / 60);
            now.setHours(now.getHours() + offset);
            /*  exdays = 60 * 60 * 1000;
              var ttaime = d.getTime() + (exdays);
              d.setTime(ttaime);*/
            var expires = "expires=" + now.toUTCString();
            document.cookie = key + "=" + val + ";" + expires + ";path=/";
        } else
            document.cookie = key + "=" + val;
    }
    getVarCookie(key) {
        var name = key + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return null;
    }
    removeVarCookie(key) {
        document.cookie = key + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    setconfig(obj) {
        this.storage = (obj.storage != undefined) ? obj.storage : this.storage;
        this.logintype = (obj.logintype != undefined) ? obj.logintype : this.logintype;
        this.exdays = (obj.exdays != undefined) ? obj.exdays : this.exdays;
        this.key = (obj.key != undefined) ? obj.key : this.key;
        var libraryurl = document.getElementById("dymerurl").src;
        var parser = document.createElement('a');
        parser.href = libraryurl;
        serverUrl = parser.protocol + "//" + parser.host;
        cdnurl = serverUrl + "/api/auth/login";
        this.baseuri = serverUrl + "/api/auth";
        this.userData = (obj.userData != undefined) ? obj.userData : this.userData;
        this.loginurl = (obj.loginurl != undefined) ? obj.loginurl : cdnurl;
        cdnurl = serverUrl + "/api/auth/logout";
        this.logouturl = (obj.logouturl != undefined) ? obj.logouturl : cdnurl;

    }



}


var dymerOauth;
var dymerOauthConfig;
(function($) {
    var confOauth = {};
    if (dymerOauthConfig != undefined)
        confOauth = dymerOauthConfig
    dymerOauth = new DymerOauth(confOauth);
    dymerOauth.run();
    /*  var dd = dymerOauth.actionUserInfo();
      console.log("dd", dd);*/
})(jQuery);