require('dotenv').config();

const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

async function sendEmail(email, name) {
  try {
    // console.log("API Key:", process.env.API_KEY);

    const mailerSend = new MailerSend({
      apiKey: process.env.API_KEY,
    });

    // Use the CORRECT "from" address from your MailerSend dashboard!
    const sentFrom = new Sender("info@trial-z86org8p9o0lew13.mlsender.net", "Jesutofunmi"); 

    const recipients = [
      new Recipient(email, name)
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject("Welcome to the TaskApp")
      // .setHtml("<strong>It worked! Keep coding</strong>")
      .setText(`Welcome to the app ${name}. Get a feel for the app and let us know what you think`);

    const response = await mailerSend.email.send(emailParams);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

async function byeEmail(email, name) {
  try {

    const mailerSend = new MailerSend({
      apiKey: process.env.API_KEY,
    });

    // Use the CORRECT "from" address from your MailerSend dashboard!
    const sentFrom = new Sender("info@trial-z86org8p9o0lew13.mlsender.net", "Jesutofunmi"); 

    const recipients = [
      new Recipient(email, name)
    ];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setReplyTo(sentFrom)
      .setSubject("Sad to see you go")
      // .setHtml("<strong>It worked! Keep coding</strong>")
      .setText(`Hey ${name}. We're sad to see you go, could you tell us how we might have served you better?`);

    const response = await mailerSend.email.send(emailParams);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = {
  sendEmail,
  byeEmail
}