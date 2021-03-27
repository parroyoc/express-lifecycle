const Lifecycle = require('./lifecycle-express');

const createFakeReq = () => ({
    middlewareCalled: []
});
const createFakeRes = () => ({
    on: jest.fn(),
    end: jest.fn()
});
const createFakeMiddleware  = (name) => (req, res, next) => {
    req.middlewareCalled.push(name);
    next();
};
const createFinishingFakeMiddleware  = (name) => (req, res, next) => {
    req.middlewareCalled.push(name);
    res.end(`Finished on ${name}`);
    next();
};

describe("Lifecycle tests", () => {
    test("it should be created exposing the middleware and the registration methods", () => {
        const lifecycle = Lifecycle();

        expect(lifecycle).toHaveProperty('middleware');
        expect(lifecycle).toHaveProperty('onRequest');
        expect(lifecycle).toHaveProperty('onPreHandler');
        expect(lifecycle).toHaveProperty('onPostHandler');
        expect(lifecycle).toHaveProperty('onResponse');
        expect(lifecycle).toHaveProperty('getRegistrations');
    });

    test("it should behave like regular middleware, receiving req, res, next and calling next at the end", () => {
        const req = createFakeReq();
        const res = createFakeRes();
        const nextSpy = jest.fn();

        const lifecycle = Lifecycle();
        lifecycle.middleware(req, res, nextSpy);

        expect(res.on.mock.calls[0][0]).toBe('finish');
        expect(nextSpy).toHaveBeenCalled();
    });

    test("it should register an onFinish event", () => {
        const req = createFakeReq();
        const res = createFakeRes();
        const nextSpy = jest.fn();

        const lifecycle = Lifecycle();
        lifecycle.middleware(req, res, nextSpy);

        expect(res.on.mock.calls[0][0]).toBe('finish');
    });

    test("it should register onRequest, onPreHandler, onPostHandler and onResponse middlewares", () => {
        const lifecycle = Lifecycle();
        lifecycle.onRequest(createFakeMiddleware('mdwOnRequest1'));
        lifecycle.onPreHandler(createFakeMiddleware('mdwOnPreHandler2'));
        lifecycle.onPostHandler(createFakeMiddleware('mdwOnPostHandler3'));
        lifecycle.onResponse(createFakeMiddleware('mdwOnResponse4'));

        const registrations = lifecycle.getRegistrations();
        expect(registrations.onRequest).toHaveLength(1);
        expect(registrations.onPreHandler).toHaveLength(1);
        expect(registrations.onPostHandler).toHaveLength(1);
        expect(registrations.onResponse).toHaveLength(1);
    });

    test("it should execute onRequest and onPreHandler in order before route handlers", () => {
        const req = createFakeReq();
        const res = createFakeRes();
        const nextSpy = jest.fn();

        const lifecycle = Lifecycle();
        const mdwOnRequest1 = createFakeMiddleware('mdwOnRequest1');
        const mdwOnPreHandler2 = createFakeMiddleware('mdwOnPreHandler2');
        lifecycle.onRequest(mdwOnRequest1);
        lifecycle.onPreHandler(mdwOnPreHandler2);

        lifecycle.middleware(req, res, nextSpy);

        expect(req.middlewareCalled).toEqual(['mdwOnRequest1', 'mdwOnPreHandler2']);
        expect(nextSpy).toHaveBeenCalled();
    });

    test("it should not execute onPostHandler and onResponse until finishing the request", () => {
        const req = createFakeReq();
        const res = createFakeRes();
        const nextSpy = jest.fn();

        const lifecycle = Lifecycle();
        const mdwOnRequest1 = createFakeMiddleware('mdwOnRequest1'); // not finishing the request
        const mdwOnPostHandler3 = createFakeMiddleware('mdwOnPostHandler3');
        const mdwOnResponse4 = createFakeMiddleware('mdwOnResponse4');
        lifecycle.onRequest(mdwOnRequest1);
        lifecycle.onPostHandler(mdwOnPostHandler3);
        lifecycle.onResponse(mdwOnResponse4);

        lifecycle.middleware(req, res, nextSpy);

        expect(req.middlewareCalled).toEqual(['mdwOnRequest1']);
        expect(nextSpy).toHaveBeenCalled();
    });

    test("it should execute onPostHandler and onResponse in order when finishing the request", () => {
        const req = createFakeReq();
        const res = createFakeRes();
        const nextSpy = jest.fn();

        const lifecycle = Lifecycle();
        const mdwOnRequest1 = createFinishingFakeMiddleware('mdwOnRequest1');
        const mdwOnPostHandler3 = createFakeMiddleware('mdwOnPostHandler3');
        const mdwOnResponse4 = createFakeMiddleware('mdwOnResponse4');
        lifecycle.onRequest(mdwOnRequest1);
        lifecycle.onPostHandler(mdwOnPostHandler3);
        lifecycle.onResponse(mdwOnResponse4);

        lifecycle.middleware(req, res, nextSpy);

        expect(req.middlewareCalled).toEqual(['mdwOnRequest1', 'mdwOnPostHandler3', 'mdwOnResponse4']);
        expect(nextSpy).toHaveBeenCalled();
    });

    // TODO add supertest to actually trigger the on('finish') event and to test with route handlers

});

