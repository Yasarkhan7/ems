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

var serviceAccount = require("./credentials/fire.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ems-vmv-default-rtdb.asia-southeast1.firebasedatabase.app"
});



// (  admin.database().ref('/exam/config/status').set({
//     fromYear:'2025',
//     toYear:'2026',
//     active:true,
//     applicationStart:'2025-09-26',
//     applicationEnd:'2025-10-26',
//     applicationFinal:'2025-11-26',
//     isWinter:true
//     })).then(el=>{
//         console.log(el)
//     })


app.use('/student',login)
app.use('/admin',admins)

        // let apps  = ( admin.firestore().collection('applications').where('acedemic_year','==','2025-2026').where('season','==','Winter').where('prn','==','').where('exam','==','Regular').where('semester','==', '2').count().get()).then(el=>{
        //   console.log(el)
        // })

app.listen(3000,()=>{
console.log('listening...')
})


