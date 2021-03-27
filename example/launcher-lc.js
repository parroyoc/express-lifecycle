const express = require('express');
const bodyParser = require('body-parser');
const detectChrome = require('./utils/detect-chrome');
const requestTraceId = require('./utils/request-trace-id');
const requestLogger = require('./utils/request-logger');
const expressLifecycle = require('../lib/lifecycle-express');
const customErrorHandler = require('./utils/custom-error-handler');
const port = 3000;

const app = express();
const lifecycle = expressLifecycle();

app.use(lifecycle.middleware);

lifecycle.onRequest(requestLogger.onRequest);
lifecycle.onResponse(requestLogger.onResponse);
lifecycle.onPostHandler(requestLogger.onPostHandler);

lifecycle.onRequest(requestTraceId);
lifecycle.onRequest(bodyParser.urlencoded({ extended: false }));
lifecycle.onRequest(bodyParser.json());

lifecycle.onPreHandler(detectChrome);

lifecycle.onPostHandler(customErrorHandler);

app.get('/get1', (req, res) => {
    console.log('get1');
    res.send('Hello 1');
});

app.get('/get-only-chrome', (req, res) => {
    console.log('get-only-chrome');
    if (!req.isChrome) throw new Error('Unauthorised');

    setTimeout(() => {
        res.send('Hello Chrome'); // Problem, this finishes the request
    }, 1000);
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});