const Mailjet = require("node-mailjet");
const logger = require("../utilities/logger");

const { MAILJET_API_KEY, MAILJET_SECRET_KEY } = process.env;

const mailjet = Mailjet.connect(MAILJET_API_KEY, MAILJET_SECRET_KEY);

/**
 * Sends an email using Mailjet
 * @param {Object} email
 * @param {Object} email.to
 * @param {string} email.to.email
 * @param {string} email.to.name
 * @param {string} email.subject
 * @param {string} email.text
 * @return {Promise<Object>} mailjet response
 */
function sendEmail(email) {
  return mailjet
    .post("send", { version: "v3.1" })
    .request({
      Messages: [
        {
          From: {
            Email: "helper@chingu.io",
            Name: "Chingu Helper",
          },
          To: [
            {
              Email: email.to.email,
              Name: email.to.name,
            },
          ],
          Subject: email.subject,
          TextPart: email.text,
        },
      ],
    })
    .catch(err => logger.error(err));
}

module.exports = { sendEmail };
