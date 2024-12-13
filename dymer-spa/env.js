(function (window) {
    window.__env = window.__env || {};

    const BASE_URL = 'http://localhost:8080/api';
    
    window.__env.BASE_URL = BASE_URL;
    window.__env.AUTH_URL = `${BASE_URL}/portalweb/authenticate`;
})(this);