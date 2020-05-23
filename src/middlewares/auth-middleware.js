const jwt = require('jsonwebtoken');
const authConfig = require('../credentials/auth-jwt.json');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader)
        return res.status(401).send({ error: 'No token provided' });

        const parts = authHeader.split(' ');

        if(!parts.length === 2)
            return res.send(401).send({ error: 'Token error'});

        const [ scheme, token ] = parts;

        if(!/^Bearer$/i.test(scheme))
            return res.send(401).send({ error: 'Token mal formated' });


        jwt.verify(token,authConfig.secret, (err, decoded) => {
            if(err) return res.status(401).send({ error: 'Token invalid' })

            req.userId = decoded.id;
            return next();
        });


};