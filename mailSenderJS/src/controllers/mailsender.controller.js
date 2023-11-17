let service = require("../services/mailsender.service")
const handlebars = require('handlebars');
let fs = require("fs")

module.exports = {
    sendMail: async function (req, res) {
        try {

            let emailInfo = req.body
            service.emailSenderService(emailInfo)
            await res.status(200).json({ "message": "Email sent" })
        } catch (e) {
            await res.status(500).json({"error: ": `${e}`})
        }
    }
}