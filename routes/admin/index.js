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

       return res.status(200).send({token});
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

    const  {scheme,branch,semester,exam,prn,season,acedemic_year}=req.query
    const data = require('../../data/allAdmin.json');
    // console.log(data)
 
    try{
        let tok = jwt.verify(req.query?.token,KEY)

        if(!data[tok.email])
            return    res.status(500).send({ message: 'Unrestricted !!' });


   
        let q = admin.firestore().collection('students').where('acedemic_year','==',acedemic_year).where('season','==',season).where('exam','==',exam).where('scheme','==',scheme).where('branch','==',branch).where('semester','==',semester)
    //    let datas  = await  .get()
       return  res.status(200).send({message:datas});
    }catch(err){
      return  res.status(400).send({ message: err });

    }
   
});

app.use(express.json({ limit: '100mb' }));

module.exports = app;
