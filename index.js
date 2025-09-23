const express = require('express')
const app = express()
const cors = require('cors')
app.use(express.json())
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors())

const login = require('./routes/student/login')

const NodeCache = require('node-cache'); // Import the node-cache library
const myCache = new NodeCache({ stdTTL: 60 });


app.use('/student',login)

app.listen(3000,()=>{
console.log('listening...')
})