'use strict';

const express = require('express');
const axios = require('axios');

const router = express.Router();

const FEDERATION_URL =
  process.env.DYMER_FEDERATION_URL ||
  'http://127.0.0.1:3004/api/v1/federation';

router.use(async (req, res) => {
  const targetUrl = `${FEDERATION_URL}${req.url}`;

  try {
    console.log(
      `[Federation Gateway] ${req.method} ${req.originalUrl}` +
      ` -> ${targetUrl}`
    );

    const headers = {
      ...req.headers
    };

    delete headers.host;
    delete headers['content-length'];

    const incomingAuthorization = req.get('authorization');

    const hasValidBearerHeader =
      typeof incomingAuthorization === 'string' &&
      /^Bearer\s+\S+$/i.test(incomingAuthorization) &&
      !/^Bearer\s+(null|undefined)$/i.test(incomingAuthorization);

    console.log(
      '[Federation Gateway] Authorization ricevuto:',
      Boolean(incomingAuthorization)
    );

    console.log(
      '[Federation Gateway] Cookie header ricevuto:',
      Boolean(req.headers.cookie)
    );

    console.log(
      '[Federation Gateway] Cookie token ricevuto:',
      Boolean(req.cookies && req.cookies.token)
    );

    console.log(
      '[Federation Gateway] Cookie disponibili:',
      Object.keys(req.cookies || {})
    );

    if (hasValidBearerHeader) {
      headers.authorization = incomingAuthorization.trim();

      console.log(
        '[Federation Gateway] Uso Authorization ricevuto dalla GUI'
      );
    } else if (req.cookies && req.cookies.token) {
      headers.authorization = `Bearer ${req.cookies.token}`;

      console.log(
        '[Federation Gateway] Authorization creato dal cookie token'
      );
    } else {
      delete headers.authorization;

      console.log(
        '[Federation Gateway] Nessun token disponibile'
      );
    }

    const forwardedAuthorization = headers.authorization || '';
    const forwardedToken = forwardedAuthorization.replace(
      /^Bearer\s+/i,
      ''
    );

    console.log(
      '[Federation Gateway] Bearer valido:',
      /^Bearer\s+\S+$/i.test(forwardedAuthorization)
    );

    console.log(
      '[Federation Gateway] Lunghezza token:',
      forwardedToken.length
    );

    console.log(
      '[Federation Gateway] Struttura JWT:',
      forwardedToken.split('.').length === 3
    );

    const axiosConfig = {
      method: req.method,
      url: targetUrl,
      headers,
      params: req.query,
      validateStatus: () => true,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      axiosConfig.data = req.body;
    }

    const response = await axios(axiosConfig);

    if (response.headers['content-type']) {
      res.set(
        'Content-Type',
        response.headers['content-type']
      );
    }

    console.log(
      `[Federation Gateway] ${req.method} ${req.originalUrl}` +
      ` <- ${response.status}`
    );

    return res
      .status(response.status)
      .send(response.data);
  } catch (error) {
    console.error(
      `[Federation Gateway] Errore su ${req.method} ${targetUrl}:`,
      error.message
    );

    return res.status(502).json({
      success: false,
      message: 'dymer-federation is not reachable',
      data: [],
      extraData: {
        target: targetUrl,
        error: error.message
      }
    });
  }
});

module.exports = router;
