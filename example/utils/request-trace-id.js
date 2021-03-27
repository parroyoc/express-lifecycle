const uuid = require('uuid');

module.exports = (req, res, next) => {
    console.log('trace id');
    req.traceId = uuid.v4();
    res.setHeader('x-trace-id', req.traceId);
    next();
};
