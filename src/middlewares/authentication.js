import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    // console.log(req.headers.authorization)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthenticated' });
    // console.log(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);
    const user = await User.findById(decoded.userId);
    // console.log(user);

    if (!user) return res.status(404).json({ message: 'User not found..' });
    
    req.userId = user._id;
    next();
  } catch (error) {
    console.log(error)
    res.status(401).json({ message: 'Unauthorized' });
  }
};
