const AppError = require('./AppError');
module.exports = (v) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, 'Invalid id');
  return n;
};
