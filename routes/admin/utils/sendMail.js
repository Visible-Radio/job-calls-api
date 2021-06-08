require("dotenv").config();
const sgMail = require('@sendgrid/mail');
const makeEmailBody = require("./makeEmailBody");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = (alerts) => {

  alerts.forEach(alert => {
    const [ address, jobMatches] = Object.entries(alert).flat();
    const { htmlBody, plainTextBody } = makeEmailBody(jobMatches);
    try {
      dispatchAlerts(htmlBody, plainTextBody);
    } catch (error) {
      //rethrow the error to be handled in the admin route function
      throw(error)
    }
  })

  function dispatchAlerts(htmlBody, plainTextBody) {
    const msg = {
      to: 'patrick.kaipainen@gmail.com', // Change to your recipient
      from: 'toronto.electrical.trades@gmail.com', // Change to your verified sender
      subject: 'Job Call Alert',
      text: plainTextBody,
      html: htmlBody,
    }
    sgMail
      .send(msg)
      .then((res) => {
        console.log(`res`, res)
        console.log('Email sent');
      })
      .catch((error) => {
        console.log("Send Grid API failure");
        console.error(error);
        // rethrow the error
        throw(error);
      })
  }
}

module.exports = sendMail;
