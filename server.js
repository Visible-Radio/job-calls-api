const express = require("express");
const app = express();
const cors = require("cors");

//middleware
app.use(express.json());
app.use(cors());

//ROUTES

// API routes for job call info
app.use('/API', require('./routes/API/API.js'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
});
