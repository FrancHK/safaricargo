const jwt = require('jsonwebtoken');

function staffAuthMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Hakuna ruhusa. Tafadhali ingia kwanza.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'staff') {
      return res.status(403).json({ error: 'Ruhusa ya mfanyakazi inahitajika.' });
    }
    req.staff = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token batili au imeisha muda.' });
  }
}

module.exports = staffAuthMiddleware;
