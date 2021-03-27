const onRequest = (req, res, next) => {
    console.log('onRequest');
    req.arrivalTime = new Date().getTime();
    next();
};

const onPostHandler = (req, res, next) => {
    console.log('onPostHandler');
    res.handlerEndTime = new Date().getTime();
    next();
};

const onResponse = (req, res, next) => {
    console.log('onResponse');
    res.responseTime = new Date().getTime();
    const ellapsedTime = res.responseTime - req.arrivalTime;
    const handlingTime = res.handlerEndTime - req.arrivalTime;
    console.log('Times: ', { ellapsedTime, handlingTime });
    next();
};

module.exports = { onRequest, onPostHandler, onResponse };
