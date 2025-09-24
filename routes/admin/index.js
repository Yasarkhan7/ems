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
        return res.status(400).send({ message: 'Restricted Access !!' });
    }
    try {
        var admin = data[email]

        if(admin?.pass!=password)
            return res.status(400).send({ message: 'Restricted Access !!' });

        console.log(data)
        if (!data) {
            return res.status(404).send({ message: 'User not found.' });
        }

        let token = jwt.sign({ ...admin}, KEY, { expiresIn: '1h' });

        res.status(200).send({token});
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
            res.status(500).send({ message: 'Unrestricted !!' });




    


    }catch{
        res.status(500).send({ message: 'Unrestricted !!' });

    }
   
});


app.get('/getExamStatus',async (req, res) => {

    try{
        let tok = jwt.verify(req.query?.token)
        const data = require('../../data/allAdmin.json');

        if(!data[tok.email])
            res.status(500).send({ message: 'Unrestricted !!' });

       let datas  = (await  admin.database().ref('/exam/config/status').get()).val() || {
        fromYear:'',
        toYear:'',
        active:true,
        applicationStart:'',
        applicationEnd:'',
        applicationFinal:'',
        isWinter:true
        }
       return  res.status(200).send(datas);
    }catch{
        res.status(500).send({ message: 'Unrestricted !!' });

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





// const fs = require('fs');
// const path = require('path');


// Middleware to parse JSON bodies with an increased size limit
app.use(express.json({ limit: '100mb' }));

// app.post('/updateExam')




// Call the function to perform the update
// updateUserInFile('./examconfig.json');


module.exports = app;
