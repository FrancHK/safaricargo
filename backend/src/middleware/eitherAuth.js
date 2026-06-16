const jwt = require('jsonwebtoken');

// Accepts either an admin token or a mapokezi staff token.
// Populates req.admin (admin shape) or req.staff (staff shape) accordingly.
function eitherAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role === 'mapokezi') {
      req.staff = decoded;
    } else {
      req.admin = decoded;
    }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = eitherAuthMiddleware;
