export const adminAuth = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
