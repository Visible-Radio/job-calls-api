const router = require('express').Router();
const db = require('../../db');
const adminAuthorization = require('../../middleware/adminAuthorization');
const sendMail = require('./utils/sendMail');

router.post('/', adminAuthorization, async(req, res) => {
  // the token contains an ISO date string from the local machine
  // this is used to get the job calls that were just inserted
  const syncDate = req.date;
  // date handling is verrrrry fuzzy since we're ignoring timezones...

  try {
    // get the most recent calls based on the date sent from the scraper
    const calls = await db.select('*').from('job_calls')
      .whereBetween('call_date_iso', [syncDate, syncDate]);

    // get all users from the alerts table
    const usersToAlert = await db.select('user_email', 'alerts_companies', 'alerts_classes').from('user_alerts')
    // filter out the one's that don't have any alerts - could be empty strings or null
    const notNullAlerts = usersToAlert.filter(user => {
      return (user.alerts_companies?.length && user.alerts_companies !== "")
        || (user.alerts_classes?.length && user.alerts_classes !=="");
    });

    // now for each user, filter calls for company && classes
    const alerts = notNullAlerts.map(({ user_email: userEmail, alerts_companies, alerts_classes}) => {
      const alertsCompanies = alerts_companies?.length
        ? alerts_companies.split(',,')
        : [];
      const alertsClasses = alerts_classes?.length
        ? alerts_classes.split(',,')
        : [];

      return { [userEmail]: calls.filter(({ company, member_class }) => {
        // user is interested in specific companies and specific classifications
        if (alertsClasses.length && alertsCompanies.length)
        return alertsClasses.includes(member_class) && alertsCompanies.includes(company);

        // user is interested in any company and specific classification
        if (alertsClasses.length && !alertsCompanies.length)
        return alertsClasses.includes(member_class);

        // user is interested in a specific company and any classification
        if (alertsCompanies.length && !alertsClasses.length)
        return alertsCompanies.includes(company)
      })}
    });

    // remove any users that have alerts set, but don't have matches in todays new calls
    const alertsWithMatches = alerts.filter(alert => Object.values(alert).flat().length);

    if (alertsWithMatches.length) {
      sendMail(alertsWithMatches);
      res.json("Notification sent");
    } else {
      res.json("No notifications");
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json("failed to retrieve alerts");
  }
});

module.exports = router;