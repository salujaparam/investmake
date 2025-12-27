// Middleware to authenticate internal requests
const { AUTH_KEY } = process.env;

const internalAuth = (req, res, next) => {
  const authToken = req.headers.authorization;

  if (authToken === `Bearer ${AUTH_KEY}`) {
    next();
  } else {
    res.status(401).send("Unauthorized");
  }
};

module.exports = { internalAuth };
