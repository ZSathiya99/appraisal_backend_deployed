const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || "appraisal_backend";

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("JWT Error:", err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = decoded;  
    req.userId = decoded.id;
    next();
  });
};

module.exports = authenticate;
