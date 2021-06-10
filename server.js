const express = require("express");
const app = express();
const cors = require("cors");

//middleware
app.use(express.json());
app.use(cors());

//ROUTES

// API routes for job call info
app.use('/API', require('./routes/API/API'));

// register and login routes
app.use('/auth', require('./routes/auth/jwtAuth'));

// CRUD opperations on user alerts route
app.use('/alerts', require('./routes/alerts/alerts'));

// admin route
// Handle sending email alerts upon receiving signal from scraper that new jobs have been added
app.use('/admin', require('./routes/admin/admin'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
