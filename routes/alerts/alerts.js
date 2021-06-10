const router = require('express').Router();
const db = require('../../db');
const authorization = require('../../middleware/authorization');

// route for getting the user's alerts
router.get('/', authorization, (req, res) => {
  const user_id = req.user;
  try {
    db('user_alerts')
      .where('user_id', '=', user_id)
      .then(([{ alerts_companies, alerts_classes }]) => {
        res.status(200).json({
          alertsCompanies:
            alerts_companies?.length
              ? alerts_companies.split(',,')
              : [],
          alertsClasses:
            alerts_classes?.length
              ? alerts_classes.split(',,')
              : []
        });
      });

  } catch (error) {
    console.error(error.message);
    res.status(500).json("failed to retrieve alerts");
  }
})

// route for adding company/classification alerts - it won't overwrite exisiting
router.put('/', authorization, (req, res) => {
  const user_id = req.user;
  const { alertsCompanies, alertsClasses } = req.body;

  // add alerts if they don't exist, don't create duplicates if they do
  try {

    if (
      !alertsCompanies.length
      || !alertsClasses.length
    ) throw new Error("bad form data");

    if (
      alertsCompanies.some(elem => !elem.length)
      || alertsClasses.some(elem => !elem.length)
    ) throw new Error("bad form data");

    db('user_alerts')
    .returning(['alerts_companies', 'alerts_classes'])
    .where('user_id', '=', user_id)
    .then(([ { alerts_companies, alerts_classes } ]) => {
      const companies = alerts_companies?.length
        ? Array.from(new Set([ ...alertsCompanies, ...alerts_companies.split(',,') ]))
        : alertsCompanies;

      const classes = alerts_classes?.length
        ? Array.from(new Set([ ...alertsClasses, ...alerts_classes.split(',,') ]))
        : alertsClasses;

      db('user_alerts')
      .where('user_id', '=', user_id)
      .update({
        alerts_companies: companies.join(',,'),
        alerts_classes: classes.join(',,')
      })
      .then(res.status(200).json({
        alertsCompanies: companies,
        alertsClasses: classes
      }));
    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json("failed to perform update");
  }
})

// route for overwritting company/classification alerts - empty array will clear all alerts
router.post('/', authorization, (req, res) => {
  const user_id = req.user;
  const { alertsCompanies, alertsClasses } = req.body;

  try {
    // foul the request if the array contains empty strings
    // must be an array
    // empty arrays are allowed
    if (
      !Array.isArray(alertsCompanies) ||
      !Array.isArray(alertsClasses) ||
      alertsCompanies.some(elem => !elem.length) ||
      alertsClasses.some(elem => !elem.length)
    ) throw new Error("bad form data");

    db('user_alerts')
    .where('user_id', '=', user_id)
    .update({
      alerts_companies: alertsCompanies.length
        ? alertsCompanies.join(',,')
        : null,
      alerts_classes: alertsClasses.length
        ? alertsClasses.join(',,')
        : null
    })
    .then(res.status(200).json({
      alertsCompanies: alertsCompanies,
      alertsClasses: alertsClasses
    }));

  } catch (error) {
    console.error(error.message);
    res.status(500).json("failed to perform update");
  }
})

router.delete('/', authorization, (req, res) => {
  // route that DELETES anything included in the request
  // anything in the incoming arrays will be deleted
  // empty arrays will be ignored

  const user_id = req.user;
  const { alertsCompanies, alertsClasses } = req.body;

  try {
    // foul the request if the array contains empty strings
    // must be an array
    // empty arrays are allowed
    if (
      !Array.isArray(alertsCompanies) ||
      !Array.isArray(alertsClasses) ||
      alertsCompanies.some(elem => !elem.length) ||
      alertsClasses.some(elem => !elem.length)
    ) throw new Error("bad form data");

    db('user_alerts')
    .returning(['alerts_companies', 'alerts_classes'])
    .where('user_id', '=', user_id)
    .then(([ { alerts_companies, alerts_classes } ]) => {

      const filteredCompanies = alerts_companies?.length
        ? alerts_companies.split(',,')
        .filter(companyFromDb => !alertsCompanies.includes(companyFromDb))
        : [];

      const filteredClasses = alerts_classes?.length
        ? alerts_classes.split(',,')
        .filter(classFromDb => !alertsClasses.includes(classFromDb))
        : [];

      db('user_alerts')
      .where('user_id', '=', user_id)
      .update({
        alerts_companies: filteredCompanies.length
          ? filteredCompanies.join(',,')
          : null,
        alerts_classes: filteredClasses.length
          ? filteredClasses.join(',,')
          : null
      })
      .then(res.status(200).json({
        alertsCompanies: filteredCompanies,
        alertsClasses: filteredClasses
      }));

    });

  } catch (error) {
    console.error(error.message);
    res.status(500).json("failed to delete specified alerts");
  }
})
module.exports = router;