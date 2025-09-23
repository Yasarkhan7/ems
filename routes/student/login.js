const express  = require('express')
const app = express.Router()
const getDB = require('../../credentials/index')

const pool = getDB.pool

// const XLSX = require('xlsx');

const jwt = require('jsonwebtoken');
const { readFile } = require('xlsx');
const KEY  = 'CC12FFJH12BUSPAS####@$!@12131'


pool.execute(`CREATE TABLE student (
    prn VARCHAR(255) NOT NULL PRIMARY KEY,
    
    name VARCHAR(255) NOT NULL,
    
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
   ).then(el=>{
    console.log(el[0])

    pool.execute(`INSERT INTO student (name, prn) 
 VALUES (?, ?);
`,["Yasar","PPOO1121334"])


})

// pool.execute( 'SELECT * FROM student',
//    ).then(el=>{
//     console.log(el[0])
// })


// Login with PRN
app.get('/login',async (req,res)=>{

    const {type,prn} = req.query 

    if(!type || !prn)
        return res.status(500).send({message:'Restricted Access !!'})

   let data  = (await  pool.execute(`SELECT * FROM student WHERE prn = ${prn} ;`))[0]?.[0]


   if(!data)
    return res.status(500).send({message:'Restricted Access !!'})

   let token  =  jwt.sign({...data,type},KEY,{expiresIn:216000})
   
   res.status(200).send({name:data?.name,token,type})

})



app.get('/getSubjects',async (req,res)=>{

    const {course,scheme,semester,branch} = req.query
   const data = require('../../data/subjects.json')
  let dat =  data?.[course]?.[branch]?.[semester]?.[scheme]

    if(dat)
   res.status(200).send(dat)
else
    res.status(500).send({message:'No data found !'})

})

app.get('/viewtoken',async (req,res)=>{
    const {token} = req.query
try{
    let a  = jwt.verify(token,KEY)

    console.log(a)


    res.status(200).send(a)

}
catch (err){
    res.status(500).send({message:'Token Expired !'})
}

})



module.exports= app;