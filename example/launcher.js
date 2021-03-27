const express = require('express');
const bodyParser = require('body-parser');
const detectChrome = require('./utils/detect-chrome');
const requestTraceId = require('./utils/request-trace-id');
const requestLogger = require('./utils/request-logger');
const customErrorHandler = require('./utils/custom-error-handler');
const port = 3000;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(requestTraceId);
app.use(detectChrome);

app.use(requestLogger.onRequest);

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

app.use(requestLogger.onPostHandler);

app.use(customErrorHandler);

app.use(requestLogger.onResponse);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});