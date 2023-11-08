nodemailer = require("nodemailer")

const options = {
    pool: true,
    host: process.env.HOST,
    port: process.env.PORT,
    secure: process.env.SECURE,
    requireTLS: process.env.REQUIRE_TLS,
    auth: {
      user: process.env.SENDER_USER,
      pass: process.env.PASSWORD,
    }
  }
  

  module.exports = {
    transportConfig: function() {
        let transporter = nodemailer.createTransport(options)
        return transporter
    }
  }