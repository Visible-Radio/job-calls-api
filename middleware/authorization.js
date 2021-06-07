const jwt = require('jsonwebtoken');
require("dotenv").config();

module.exports = (req, res, next) => {
  // get the token that the client sent
  const token = req.header("token");

  if (!token) {
    return res.status(403).json("Not Authorized");
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // append a property called user to the request
    // which should be the user_id we put in the token payload
    // when they signed in or registered
    req.user = payload.user;

    // on to the next middleware
    next();

  } catch (error) {
    // if the token isn't valid jwt.verify will throw an error
    // which our catch block should handle
    console.error(error.message)
    return res.status(403).json("Not Authorized");
  }

}