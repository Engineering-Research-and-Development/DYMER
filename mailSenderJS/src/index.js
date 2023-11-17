var express = require('express');
require('dotenv').config()

var app = express();

bodyParser = require('body-parser');

let port = process.env.SERVER_PORT
let mailRoutes = require("./router/mailRoutes")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(mailRoutes)

app.listen(port, () => {
    console.log(`MailSender listening on port ${port}`)
  })
  