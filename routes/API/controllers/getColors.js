const { colors, readableClassification } = require('../resources/config');

function getColors(req, res) {
  try {
    res.json([colors, readableClassification])
  } catch(error) {
    console.error(error.message);
    res.status(500).json("failed to send color data");
  }
}

module.exports = getColors;