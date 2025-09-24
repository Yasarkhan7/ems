const express = require('express')
const app = express()
const cors = require('cors')
app.use(express.json({ limit: '100mb' }))
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors())

const login = require('./routes/student/login')
const admins = require('./routes/admin/index')



var admin = require("firebase-admin");

var serviceAccount = require("../../credentials/fire.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ems-vmv-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const NodeCache = require('node-cache'); // Import the node-cache library
const myCache = new NodeCache({ stdTTL: 60 });


app.use('/student',login)
app.use('/admin',admins)


app.listen(3000,()=>{
console.log('listening...')
})