module.exports = (req, res, next) => {
    console.log('Detect Chrome');
    const userAgent = req.header('User-Agent');
    req.isChrome = userAgent.indexOf('Chrome') >= 0;
    next();
};
