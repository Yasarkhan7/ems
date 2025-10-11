const express = require('express');
const app = express.Router();
const getDB = require('../../credentials/index');
const jwt = require('jsonwebtoken');

const cors = require('cors')

app.use(express.json({ limit: '100mb' }))
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(cors())


var pool ;
pool =  getDB.pool;

const KEY = 'CC12FFJH12BUSPAS####@$!@12131';

var admin = require("firebase-admin");


app.post('/getControlSheet',async (req, res) => {

    const  {scheme,branch,semester,exam,prn,season,acedemic_year}=req.body
    const data = require('../../data/allAdmin.json');
 
    try{
        let tok = jwt.verify(req.query?.token,KEY)

        if(!data[tok.email])
            return    res.status(500).send({ message: 'Unrestricted !!' });

        // console.log(req.body)
        let q  = admin.firestore().collection('applications').where('status','==',req.query?.mode ||'PENDING').where('acedemic_year','==',acedemic_year).where('season','==',season).where('exam','==',exam)
        if(scheme!='All')
        q = q.where('type','==',scheme)
        
        if(branch)
        q = q.where('branch','==',branch)
      
        if(semester!='All')
        q = q.where('semester','==',semester)

        let qr;
        let datii
        if(prn){
          qr =   q.where('prn','==',prn)

      
        datii = (await qr?.get())

        if(datii.empty){
          qr = q.where('email_id','==',prn)
          datii = (await qr?.get())
        }
      }else{
        datii = (await q?.get())      
      }


      let dat = [];

       ;(datii).forEach(eli=>{
        dat.push({...eli.data(),id:eli.id})
       })
       return  res.status(200).send(dat);
    }catch(err){
      console.log(err)
      return  res.status(400).send({ message: 'Token expired !!' });

    }
   
});





app.use(express.json({ limit: '100mb' }));

module.exports = app;
