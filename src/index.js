const express = require('express');
const bodyParser = require('body-parser');

const { port, address } = require('./credentials/config-url.json')

const app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

require('./controllers/authController')(app)
require('./controllers/projectController')(app)

// app.get('/', (req, res) => {
//     res.send('OK')
// });

console.log(`API Started in http://${address}:${port}`)

app.listen(port);