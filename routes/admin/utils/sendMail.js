require("dotenv").config();
const sgMail = require('@sendgrid/mail');
const makeEmailBody = require("./makeEmailBody");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (alerts) => {

  const emails = alerts.map(alert => {
    const [ address, jobMatches] = Object.entries(alert).flat();
    const { htmlBody, plainTextBody } = makeEmailBody(jobMatches);
    return dispatchAlerts(address, htmlBody, plainTextBody);
  })

  return Promise.allSettled(emails);

  function dispatchAlerts(address, htmlBody, plainTextBody) {
    return new Promise((resolve, reject) => {
      const msg = {
        to: address, //
        from: 'toronto.electrical.trades@gmail.com', //
        subject: 'Job Call Alert',
        text: plainTextBody,
        html: htmlBody,
      }
      sgMail
        .send(msg)
        .then((res) => {
          resolve(res);
        })
        .catch((error) => {
          reject(error);
        })
    })
  }
}

module.exports = sendMail;
