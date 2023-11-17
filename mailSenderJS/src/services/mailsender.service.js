let utils = require("../utils/promification")
let flat = require ("../utils/utils")
let hbs = require("handlebars")

module.exports = {
    emailSenderService: async function(payloads) {
    
    payloads.forEach(async payload => {        

    let infoMail = payload.mailInfo
    const interpolationData = flat.nestedToFlatten(payload.interpolationData)
    console.log("interpolatinData ", interpolationData)
    console.log("infoMail ", JSON.stringify(infoMail))
    const body = hbs.compile(infoMail.mailBody)

        const email = {            

            from: process.env.SENDER_USER, //infoMail.from,
            to: infoMail.to,
            cc: infoMail.cc,
            bcc: infoMail.bcc,
            subject: infoMail.subject,
            lang: infoMail.lang,
            html: body(interpolationData)
        }

        try {
           let resp = await utils.sendMail(email)
            console.log("Resp: ", resp)               
     
         } catch (e) {
             throw e
         }    
        });
        return {"message": "Mail sent"}
    }
}