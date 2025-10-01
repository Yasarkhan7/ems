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



app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const data = require('../../data/allAdmin.json');

    if (!email || !password) {
        return res.status(400).send({ message: 'Email Password Not valid' });
    }

           // console.log(data)
           if (!data) {
            return res.status(404).send({ message: 'User not found.' });
        } 

    try {
        var admin = data[email]

        if(admin?.pass!=password)
            return res.status(400).send({ message: 'Incorrect Password !!' });

 
        let token = jwt.sign({ email,access:admin.access}, KEY, { expiresIn: '1h' });

       return res.status(200).send({token,email,access:admin.access});
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ message: 'An error occurred during login.' });
    }
});


app.post('/updateExam',async (req, res) => {

    try{
        let tok = jwt.verify(req.query?.token)
        const data = require('../../data/allAdmin.json');

        if(!data[tok.email])
         return   res.status(500).send({ message: 'Unrestricted !!' });

      let datas =   (await  admin.database().ref('/exam/config/status').set(req.body)).val()
       
      return    res.status(200).send({ message: 'Done !!' });

    }catch{
     return    res.status(500).send({ message: 'Unrestricted !!' });

    }
   
});


app.get('/getExamStatus',async (req, res) => {

    try{
        let tok = jwt.verify(req.query?.token,KEY)
        const data = require('../../data/allAdmin.json');

        console.log(tok)
        if(!data[tok.email])
         return    res.status(500).send({ message: 'Unrestricted !!' });

       let datas  = (await  admin.database().ref('/exam/config/status').get()).val() || {
        fromYear:'',
        toYear:'',
        active:true,
        applicationStart:'',
        applicationEnd:'',
        applicationFinal:'',
        isWinter:true
        }

        if(datas?.applicationFinal && new Date(datas?.applicationFinal || 0).getTime()>Date.now())
            datas.active=true
        else
            datas.active=false

       return  res.status(200).send(datas);
    }catch(err){
      return  res.status(500).send({ message: err });

    }
   
});

app.get('/updateExamStatus',async (req, res) => {

    try{
        let tok = jwt.verify(req.query?.token)
        const data = require('../../data/allAdmin.json');

        let body = req.body

        if(!data[tok.email])
            res.status(500).send({ message: 'Unrestricted !!' });

       let datas = (await  admin.database().ref('/exam/config/status').set(body)) 
       return  res.status(200).send({message:'Success'});
    }catch{
        res.status(500).send({ message: 'Unrestricted !!' });

    }
});



app.post('/createStudent',async (req, res) => {

    const data = req.body
    // console.log(data)

    try{
        let tok = jwt.verify(req.query?.token,KEY)

        const dataa = require('../../data/allAdmin.json');

        if(!dataa[tok.email])
            return    res.status(500).send({ message: 'Unrestricted !!' });
   
        data.active=true
        data.createdOn=Date.now()

    data.forEach(async el=>{
       let datas  = await  admin.firestore().collection('students').add(el)
    })
       return  res.status(200).send({message:'Done'});
    }catch(err){
      return  res.status(400).send({ message: err });

    }
   
});


const NodeCache = require('node-cache'); // Import the node-cache library
const myCache = new NodeCache({ stdTTL: 60 });


app.post('/getAllApplications',async (req, res) => {

    const  {scheme,branch,semester,exam,prn,season,acedemic_year}=req.body
    const data = require('../../data/allAdmin.json');
 
    try{
        let tok = jwt.verify(req.query?.token,KEY)

        if(!data[tok.email])
            return    res.status(500).send({ message: 'Unrestricted !!' });

        console.log(req.body)

        let q = admin.firestore().collection('applications').where('status','==',req.query?.mode ||'PENDING').where('acedemic_year','==',acedemic_year).where('season','==',season).where('exam','==',exam).where('type','==',scheme).where('branch','==',branch).where('semester','==',semester)

        if(prn)
            q.where('prn','==',prn)
        let dat = []
       ;(await  q.get()).forEach(eli=>{
        // console.log(eli.data())
        dat.push({...eli.data(),id:eli.id})
       })
       return  res.status(200).send(dat);
    }catch(err){
      return  res.status(400).send({ message: 'Token expired !!' });

    }
   
});


app.get('/approvePayment',async (req, res) => {

    const  {id,fee_late,invoiceId,fee_paid}=req.query
    const data = require('../../data/allAdmin.json');
 
    try{
        let tok = jwt.verify(req.query?.token,KEY)

        if(!data[tok.email] || !invoiceId || !id  || !fee_paid)
            return    res.status(500).send({ message: 'Unrestricted !!' });

        // console.log(req.body)

        let q =await admin.firestore().doc('applications/'+id).set({fee_late,invoiceId,fee_paid,fee_paid_on:Date.now(),status:'PAID'},{merge:true})

       return  res.status(200).send({message:'Field updated !!'});
    }catch(err){
      return  res.status(400).send({ message: 'Token expired !!' });

    }
   
});


app.post('/approveApplication',async (req, res) => {

    const  body=req.body
    const data = require('../../data/allAdmin.json');
 
    try{
        let tok = jwt.verify(req.query?.token,KEY)

        if(!data[tok.email] || !body)
            return    res.status(500).send({ message: 'Unrestricted !!' });

        // console.log(req.body)

        let count  = (await admin.firestore().collection('applications').where('status','==','APPROVED').where('type','==',body.type).where('semester','==',body.semester).where('exam','==',body.exam).count().get()).data().count
        
        let obj
        seq.forEach(el=>{
            if(el.scheme==body.type && el.type==body.exam && el.semester==body.semester){
                obj=el
            }
        })

        var rollNo=count+obj?.startsFrom ||0

        

        let q =await admin.firestore().doc('applications/'+body.id).set({...body,approvedBy:tok.email,approvedOn:Date.now(),status:'APPROVED',rollNo},{merge:true})

       return  res.status(200).send({message:'Field updated !!',rollNo});
    }catch(err){
        console.log(err)
      return  res.status(400).send({ message: 'Token expired !!' });

    }
   
});

app.use(express.json({ limit: '100mb' }));

module.exports = app;

const seq=[{
    scheme:'BA-CBCS',semester:1,type:'Backlog', startsFrom:220001
  },{
    scheme:'BA-CBCS',semester:2,type:'Backlog', startsFrom:220051
  },{
    scheme:'BA-CBCS',semester:3,type:'Backlog', startsFrom:220081
  },{
    scheme:'BA-CBCS',semester:4,type:'Backlog', startsFrom:220131
  },{
    scheme:'BA-CBCS',semester:5,type:'Backlog', startsFrom:220191
  },{
    scheme:'BA-CBCS',semester:6,type:'Backlog', startsFrom:220301
  },{
    scheme:'BSC-CBCS',semester:1,type:'Backlog', startsFrom:220451
  },{
    scheme:'BSC-CBCS',semester:2,type:'Backlog', startsFrom:220511
  },{
    scheme:'BSC-CBCS',semester:3,type:'Backlog', startsFrom:220571
  },{
    scheme:'BSC-CBCS',semester:4,type:'Backlog', startsFrom:220681
  },{
    scheme:'BSC-CBCS',semester:5,type:'Backlog', startsFrom:220801
  },{
    scheme:'BSC-CBCS',semester:6,type:'Backlog', startsFrom:220901
  },
  ,{
    scheme:'BSCHS-CBCS',semester:1,type:'Backlog', startsFrom:221051
  },{
    scheme:'BSCHS-CBCS',semester:2,type:'Backlog', startsFrom:221056
  },{
    scheme:'BSCHS-CBCS',semester:3,type:'Backlog', startsFrom:221061
  },{
    scheme:'BSCHS-CBCS',semester:4,type:'Backlog', startsFrom:221070
  },{
    scheme:'BSCHS-CBCS',semester:5,type:'Backlog', startsFrom:221080
  },{
    scheme:'BSCHS-CBCS',semester:6,type:'Backlog', startsFrom:221086
  }
  ,{
    scheme:'UG-NEP-OLD',semester:1,type:'Backlog', startsFrom:221091
  },{
    scheme:'UG-NEP-OLD',semester:2,type:'Backlog', startsFrom:221171
  },{
    scheme:'UG-NEP-OLD',semester:3,type:'Backlog', startsFrom:221251
  },{
    scheme:'UG-NEP-OLD',semester:4,type:'Backlog', startsFrom:221351
  },{
    scheme:'UG-NEP-OLD',semester:5,type:'Regular', startsFrom:111401
  },
  ,{
    scheme:'UG-NEP-NEW',semester:1,type:'Regular', startsFrom:110001
  },
  {
    scheme:'UG-NEP-NEW',semester:1,type:'Backlog', startsFrom:221551
  },
  {
    scheme:'UG-NEP-NEW',semester:2,type:'Backlog', startsFrom:221851
  },
  
  ,{
    scheme:'UG-NEP-NEW',semester:3,type:'Regular', startsFrom:110801
  },
  {
    scheme:'PG-NEP',semester:1,type:'Regular', startsFrom:111901
  },
  ,
  {
    scheme:'PG-NEP',semester:1,type:'Backlog', startsFrom:222151
  },
  {
    scheme:'PG-NEP',semester:2,type:'Backlog', startsFrom:222301
  },
  
  {
    scheme:'PG-NEP',semester:3,type:'Regular', startsFrom:112351
  },
  {
    scheme:'PG-NEP',semester:3,type:'Backlog', startsFrom:222351
  },
  {
    scheme:'PG-NEP',semester:4,type:'Backlog', startsFrom:222451
  },
  ]
