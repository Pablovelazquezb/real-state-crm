const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Authentication failed , Token missing" });
    }

    if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
    } else if (token.startsWith("Bearer")) {
        token = token.slice(6).trim();
    }

    try {
        const secretKey = process.env.JWT_SECRET || 'secret_key';
        const decode = jwt.verify(token, secretKey);
        req.user = decode;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Authentication failed. Invalid token.' });
    }
};

module.exports = auth;