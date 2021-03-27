Express Lifecycle

The goal of this package is to increase the control over the order of execution of express middleware.

By default, Express uses middleware that has to be declared in the order of execution, forming a chain of responsibility pattern. That forces the setup in a way that might not align with the business logic. As a result, when we need some feature to take partial actions at different points of the request (e.g. a tracing or logging tool), it must be divided into parts and scattered across the server setup.

This package allows attaching middleware at certain points of the lifecycle:
- OnRequest: as soon as the request starts to be handled and the req, res objects are created. For example, this can be useful to parse cookies, capture a log with the arriving timestamp, creating a request correlation-id, etc.
- OnPreHandler: before checking the request URI for handlers. For example, this can be useful to check for headers or authentication in a generic fashion.
- OnPostHandler: after handling the request. For example, this can be useful to return some error codes, fallback handlers, etc.
- OnResponse: right before responding the request. Similar to OnRequest, can be used for traceability, or to set/update some session id, cookies, etc.

Lifecycle itself is a middleware, so it can still combine with other normal style middleware, when that makes sense.

In summary, middleware logic can be defined however feels more appropiate. The server setup can be simpler and feel cleaner. 

Example:

The initial setup is as follows:
```
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
```

Notice requestLogger is scattered in 3 places. Also some middleware is before and some is after the handlers.

Now compare with the implementation with Lifecycle:
```
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
```

Here, lifecycle is created as middleware, but the rest of middleware is defined in any order. For example, the requestLogger is all defined together. Also the route handlers are defined at the end.

PLANNED FEATURES:
- Use order in stages
- Add the concept of lifecycle middleware, that potentially defines onRequest, onResponse, onPreHandler and onPostHandler internally (e.g. the logger, metrics, etc).

