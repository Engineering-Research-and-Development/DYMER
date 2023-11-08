let config = require("../config/transport")

module.exports = {
    sendMail: async function(mailInfo) {
        return await sendMailPromise(mailInfo)
    }
}


let sendMailPromise = function (mailOptions) {
    return new Promise((resolve, reject) => {
        let transporter = config.transportConfig();

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                reject(error); 
            } else {
                resolve(info)
            }
        });
    })
}