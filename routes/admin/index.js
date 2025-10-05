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

 
        let token = jwt.sign({ email,access:admin.access}, KEY, { expiresIn: '6h' });

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

app.post('/updateExamStatus',async (req, res) => {

    try{
        let tok = jwt.verify(req.query?.token,KEY)
        const data = require('../../data/allAdmin.json');

        let body = req.body

        if(!data[tok.email])
            res.status(500).send({ message: 'Unrestricted !!' });

       let datas = (await  admin.database().ref('/exam/config/status').set(body)) 
       return  res.status(200).send({message:'Success'});
    }catch(err){
        console.log(err)
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



app.get('/getAllApplicationsCount',async (req, res) => {

  const data = require('../../data/allAdmin.json');

  try{
      let tok = jwt.verify(req.query?.token,KEY)

      if(!data[tok.email])
          return    res.status(500).send({ message: 'Unrestricted !!' });

      // console.log(req.body)
      let dat={
        pending: (await admin.firestore().collection('applications').where('status','==','PENDING').count().get()).data().count,
        paid: (await admin.firestore().collection('applications').where('status','==','PAID').count().get()).data().count,
        approved: (await admin.firestore().collection('applications').where('status','==','APPROVED').count().get()).data().count,
      }

      
    //   let deleted = 0
    //  ;(await admin.firestore().collection('applications').where('dob','==','2025-10-05').get()).forEach(async el=>{
    //     admin.firestore().doc('applications/'+el.id).delete().then(el=>{
    //       deleted++
    //       console.log(deleted)
    //     })
    //   })
      
     return  res.status(200).send(dat);
  }catch(err){
    console.log(err)
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

app.get('/getTotalStudents',async (req, res) => {

    const data = require('../../data/allAdmin.json');
 
    try{
        let tok = jwt.verify(req.query?.token,KEY)

        if(!data[tok.email] )
            return    res.status(500).send({ message: 'Unrestricted !!' });

        // console.log(req.body)

        let count =(await admin.firestore().collection('students/').count().get()).data().count

       return  res.status(200).send({count});
    }catch(err){
        console.log(err)
      return  res.status(400).send({ message: 'Token expired !!' });

    }
   
});

app.get('/getStudent',async (req, res) => {
    const data = require('../../data/allAdmin.json');
    try{
        let tok = jwt.verify(req.query?.token,KEY)
        if(!data[tok.email]  || !req.query.search)
            return    res.status(500).send({ message: 'Unrestricted !!' });

        let dataa=[]
        let search= req.query.search
        if(req.query.type=='enrollment_no')
            search=parseInt(req.query.search+'')
     

        console.log(req.query)
        ;(await admin.firestore().collection('students').where(req.query.type,'==',search).get()).forEach(el=>{
            console.log(el.data())

            dataa.push({...el.data(),id:el.id})
        })

       return  res.status(200).send(dataa);
    }catch(err){
        console.log(err)
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
  let count =0
        if(body.department=='HOME SCIENCE' && body.type=='MSC-CBCS')
        count  = (await admin.firestore().collection('applications').where('status','==','APPROVED').where('department','==',body.department).where('type','==',body.type).where('semester','==',body.semester).where('exam','==',body.exam).count().get()).data().count
        else if( body.type=='MSC-CBCS')
          count  = (await admin.firestore().collection('applications').where('status','==','APPROVED').where('department','!=','HOME SCIENCE').where('type','==',body.type).where('semester','==',body.semester).where('exam','==',body.exam).count().get()).data().count
        else
        count  = (await admin.firestore().collection('applications').where('status','==','APPROVED').where('type','==',body.type).where('semester','==',body.semester).where('exam','==',body.exam).count().get()).data().count

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

app.post('/updateApplication',async (req, res) => {

  const  body=req.body
  const data = require('../../data/allAdmin.json');

  try{
      let tok = jwt.verify(req.query?.token,KEY)

      if(!data[tok.email] || !body)
          return    res.status(500).send({ message: 'Unrestricted !!' });

      let q =await admin.firestore().doc('applications/'+body.id).set({...body},{merge:true})

     return  res.status(200).send({message:'Data  updated !!'});
  }catch(err){
      console.log(err)
    return  res.status(400).send({ message: 'Token expired !!' });

  }
 
});

app.get('/deleteApplication',async (req, res) => {

  const data = require('../../data/allAdmin.json');

  try{
      let tok = jwt.verify(req.query?.token,KEY)

      if(!data[tok.email])
          return    res.status(500).send({ message: 'Unrestricted !!' });

      let q =await admin.firestore().doc('applications/'+req.query.id).delete()

     return  res.status(200).send({message:'Data  updated !!'});
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
  },
  
  {
    scheme:'MA-CBCS',semester:1,type:'Backlog', startsFrom:220451
  },
  {
    scheme:'MA-CBCS',semester:2,type:'Backlog', startsFrom:220456
  },{
    scheme:'MA-CBCS',semester:3,type:'Backlog', startsFrom:220461
  },{
    scheme:'MA-CBCS',semester:4,type:'Backlog', startsFrom:220466
  },
  
  {
    scheme:'BSC-CBCS',semester:1,type:'Backlog', startsFrom:220471
  },{
    scheme:'BSC-CBCS',semester:2,type:'Backlog', startsFrom:220531
  },{
    scheme:'BSC-CBCS',semester:3,type:'Backlog', startsFrom:220591
  },{
    scheme:'BSC-CBCS',semester:4,type:'Backlog', startsFrom:220701
  },{
    scheme:'BSC-CBCS',semester:5,type:'Backlog', startsFrom:220941
  },{
    scheme:'BSC-CBCS',semester:6,type:'Backlog', startsFrom:221051
  },

  ,{
    scheme:'BSCHS-CBCS',semester:1,type:'Backlog', startsFrom:221201
  },{
    scheme:'BSCHS-CBCS',semester:2,type:'Backlog', startsFrom:221206
  },{
    scheme:'BSCHS-CBCS',semester:3,type:'Backlog', startsFrom:221211
  },{
    scheme:'BSCHS-CBCS',semester:4,type:'Backlog', startsFrom:221216
  },{
    scheme:'BSCHS-CBCS',semester:5,type:'Backlog', startsFrom:221221
  },{
    scheme:'BSCHS-CBCS',semester:6,type:'Backlog', startsFrom:22131
  },


  {
    scheme:'MSC-CBCS',semester:1,type:'Backlog', startsFrom:221231
  },
  {
    scheme:'MSC-CBCS',semester:2,type:'Backlog', startsFrom:221241
  },{
    scheme:'MSC-CBCS',semester:3,type:'Backlog', startsFrom:221251
  },{
    scheme:'MSC-CBCS',semester:4,type:'Backlog', startsFrom:221261
  },

  {
    scheme:'MSCHS-CBCS',semester:1,type:'Backlog', startsFrom:221271
  },
  {
    scheme:'MSCHS-CBCS',semester:2,type:'Backlog', startsFrom:221276
  },{
    scheme:'MSCHS-CBCS',semester:3,type:'Backlog', startsFrom:221281
  },{
    scheme:'MSCHS-CBCS',semester:4,type:'Backlog', startsFrom:221286
  },

  ,{
    scheme:'UG-NEP-OLD',semester:1,type:'Backlog', startsFrom:221291
  },{
    scheme:'UG-NEP-OLD',semester:2,type:'Backlog', startsFrom:221371
  },{
    scheme:'UG-NEP-OLD',semester:3,type:'Backlog', startsFrom:221451
  },{
    scheme:'UG-NEP-OLD',semester:4,type:'Backlog', startsFrom:221551
  },{
    scheme:'UG-NEP-OLD',semester:5,type:'Regular', startsFrom:111401
  },
  ,{
    scheme:'UG-NEP-NEW',semester:1,type:'Regular', startsFrom:110001
  },
  {
    scheme:'UG-NEP-NEW',semester:1,type:'Backlog', startsFrom:221751
  },
  {
    scheme:'UG-NEP-NEW',semester:2,type:'Backlog', startsFrom:222051
  },
  
  ,{
    scheme:'UG-NEP-NEW',semester:3,type:'Regular', startsFrom:110801
  },
  {
    scheme:'PG-NEP',semester:1,type:'Regular', startsFrom:111901
  },
  ,
  {
    scheme:'PG-NEP',semester:1,type:'Backlog', startsFrom:222351
  },
  {
    scheme:'PG-NEP',semester:2,type:'Backlog', startsFrom:222501
  },
  
  {
    scheme:'PG-NEP',semester:3,type:'Regular', startsFrom:112351
  },
  {
    scheme:'PG-NEP',semester:3,type:'Backlog', startsFrom:222551
  },
  {
    scheme:'PG-NEP',semester:4,type:'Backlog', startsFrom:222651
  },
  ]
