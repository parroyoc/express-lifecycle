const queueMiddleware = (queue, middleware, order) => {
    queue.push(middleware); // TODO use order
};

const Lifecycle = () => {
    console.log('Create Lifecycle');
    const onRequestMdw = [];
    const onPreHandlerMdw = [];
    const onPostHandlerMdw = [];
    const onResponseMdw = [];

    return {
        onRequest: (middleware, order) => queueMiddleware(onRequestMdw, middleware, order),
        onPreHandler: (middleware, order) => queueMiddleware(onPreHandlerMdw, middleware, order),
        onPostHandler: (middleware, order) => queueMiddleware(onPostHandlerMdw, middleware, order),
        onResponse: (middleware, order) => queueMiddleware(onResponseMdw, middleware, order),
        getRegistrations: () => ({
            onRequest: onRequestMdw,
            onPreHandler: onPreHandlerMdw,
            onPostHandler: onPostHandlerMdw,
            onResponse: onResponseMdw,
        }),
        middleware: (req, res, next) => {
            let carryOn = true;
            const dummyNext = () => null;
            const executeQueueWhileCarryOn = (queue) => {
                for (let i=0;carryOn && i<queue.length;i++) {
                    const mdw = queue[i];
                    mdw(req, res, dummyNext); // without next, we control that
                }
            };

            // in case some handler calls end, do the post middlewares with the original end()
            const originalEnd = res.end;
            res.end = function() {
                res.end = originalEnd; 
                executeQueueWhileCarryOn(onPostHandlerMdw);
                executeQueueWhileCarryOn(onResponseMdw);
                carryOn = false; // skip the rest of stages
                return res.end(); // actually end the request handling
            }

            // before the route handlers
            executeQueueWhileCarryOn(onRequestMdw);
            executeQueueWhileCarryOn(onPreHandlerMdw);

            // after the route handlers, if post handlers haven't ran yet
            res.on("finish", () => {
                executeQueueWhileCarryOn(onPostHandlerMdw);
                executeQueueWhileCarryOn(onResponseMdw);
            });

            next(); // Behave like a normal middleware
        }
    }
};

module.exports = Lifecycle;
