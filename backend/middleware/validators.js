import mongoose from 'mongoose';

export function requireValidObjectId(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params?.[paramName];
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ message: 'Invalid identifier' });
    }
    return next();
  };
}
