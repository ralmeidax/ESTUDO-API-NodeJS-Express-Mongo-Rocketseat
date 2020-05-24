const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');

const { host, port, user, pass } = require('../credentials/mail.json');

console.log(`Host: ${host} Port: ${port}`)

const transport = nodemailer.createTransport({
    host,
    port,
    auth:  {user, pass },
  });

  transport.use('compile', hbs({
    viewEngine: {
      extname: '.html', // handlebars extension
      layoutsDir: path.resolve('./src/resources/mail/'), // location of handlebars templates
      defaultLayout: 'template', // name of main template
      partialsDir: path.resolve('./src/resources/mail/'), // location of your subtemplates aka. header, footer etc
    } ,
    viewPath: path.resolve('./src/resources/mail/'),
    extName: '.html'
  }));


  module.exports = transport;