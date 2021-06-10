const jwt = require('jsonwebtoken');
require("dotenv").config();

module.exports = (req, res, next) => {
  // get the token that the client sent
  const token = req.header("token");

  if (!token) {
    return res.status(403).json("Not Authorized");
  }

  try {
    const payload = jwt.verify(token, process.env.ADMIN_TOKEN_SECRET);
    // append a property called date to the request
    // which should be the date generated by the scraper we put in the token payload
    req.date = payload.date;
    // on to the next middleware
    next();

  } catch (error) {
    // if the token isn't valid jwt.verify will throw an error
    // which our catch block should handle
    console.error(error.message)
    return res.status(403).json("Not Authorized");
  }

}

/*
// generate a token at the command line
// eventually the scraper will do this

const jwt = require('jsonwebtoken');
require('dotenv').config();
const payload = {
  date: new Date().toISOString().slice(0, 10)
}
jwt.sign(payload, process.env.ADMIN_TOKEN_SECRET, {expiresIn: "1m"});

*/