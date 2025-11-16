import User from '../models/User.js';

export const verifyCraftsman = async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.userType !== 'craftsman') {
        return res.status(403).json({ message: 'Access restricted to craftsmen only' });
      }
  
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error during craftsman verification' });
    }
  };

  export const verifyIndividual = async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      if (user.userType !== 'individual') {
        return res.status(403).json({ message: 'Access restricted to individuals only' });
      }
  
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error during individual verification' });
    }
  };
  
