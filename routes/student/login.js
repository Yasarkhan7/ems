const express = require('express');
const app = express.Router();
const getDB = require('../../credentials/index');
const jwt = require('jsonwebtoken');

var pool ;
pool =  getDB.pool;

const KEY = 'CC12FFJH12BUSPAS####@$!@12131';
var admin = require("firebase-admin");


app.use(express.json({ limit: '100mb' }));

// Login with Enrollment Number (PRN)
app.get('/login', async (req, res) => {
    const { type, prn } = req.query;

    if (!type || !prn) {
        return res.status(400).send({ message: 'Restricted Access !!' });
    }

    try {
        // Use a parameterized query to prevent SQL injection
                var datae = (await admin.firestore().collection('students').where('enrollment_no','==',parseInt(prn)).get())

                if(datae.empty)
                    datae = (await admin.firestore().collection('students').where('enrollment_no','==',prn).get())
                    

        // console.log(datae?.docs?.[0]?.data(),prn)
        if (datae.empty) {
            return res.status(404).send({ message: 'User not found.' });
        }
        const data  = datae.docs[0].data()
        let token = jwt.sign({ ...data, type, prn }, KEY, { expiresIn: '1h' });
        res.status(200).send({ name: data?.full_name, token, type, prn });
    } catch (error) {
        // console.error('Login error:', error);
        res.status(500).send({ message: error });
    }
});

// Get subjects based on course details
app.get('/getSubjects', async (req, res) => {
    const { token,scheme, semester, branch } = req.query;

    // console.log(scheme,semester,branch)
    try {
        jwt.verify(token, KEY);
        const data = require('../../data/subjects.json');

        const filt = []


        data.forEach(el=>{
            // if(scheme==el.scheme)
                // console.log(el.scheme)
            if((el.semester==semester && scheme==el.scheme) )
                filt.push(el)
        })
  
        if (filt.length>0) {
            res.status(200).send(filt);
        } else {
            res.status(404).send({ message: 'No data found !' });
        }
    } catch (err) {
        console.log(err)
        res.status(401).send({ message: err });
    }
});

app.get('/getStudentPersonalDetails', async (req, res) => {
    const { token } = req.query;
    try {
       const decrypt =  jwt.verify(token, KEY);
       res.status(200).send(decrypt);

    } catch (err) {
        res.status(401).send({ message: 'Invalid or expired Token' });
    }
});



const multer = require('multer');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // The directory to save the files. Create this folder!
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
  });
  
 const upload = multer({ storage: storage });


app.post('/uploadImage',upload.single('profileImage'), async (req, res) => {
    const { token } = req.query;
    try {
       const decrypt =  jwt.verify(token, KEY);

        res.status(200).send(req.file.filename);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.get('/uploads/:filename',async (req, res) => {
    try {

        const filePath = __dirname?.replace('/routes/student','')+'/uploads/'+ req.params.filename; // Construct the absolute file path

        // console.log(filePath)
    res.sendFile(filePath, (err) => {
        if (err) {
            // console.error('Error sending file:', err);
            res.status(404).send({ message: 'File not found.' });
        }
    });


        // res.status(200).send(req.file.filename);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


app.get('/getExamStatus',async (req, res) => {

    try{
        let tok = jwt.verify(req.query?.token,KEY)

     
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


app.post('/submitApplication',async (req, res) => {

    const body = req.body
    try{


        let tok = jwt.verify(req.query?.token,KEY)



        let datas  = (await  admin.database().ref('/exam/config/status').get()).val()
        if(datas?.applicationFinal && new Date(datas?.applicationFinal || 0).getTime()>Date.now())
            datas.active=true
        else
            datas.active=false

            if(!datas.active || Object.keys(req.body ||'{}').length==0)
                return  res.status(401).send({ message: 'Application Expired !!',status:401 });
    

        let acedemic_year = datas.fromYear+'-'+datas.toYear
        let season = datas.isWinter?'Winter':'Summer'

        // body.prn='sdswdd'
        // console.log(acedemic_year,season)
        let apps  = (await admin.firestore().collection('applications').where('acedemic_year','==',acedemic_year).where('season','==',season).where('prn','==',body.prn ||'').where('exam','==',body.exam ||'').where('semester','==',body.semester ||'').count().get()).data().count
        if(apps)
            return res.status(402).send({ message: 'Form already Submitted !!' ,status:402})

      
            body.status = 'PENDING'
            body.createdOn = Date.now()
            body.acedemic_year = acedemic_year
            body.season=season

            // let id ='asas'


            let id = (await admin.firestore().collection('applications').add(body)).id

                
            let docs = (await admin.firestore().collection('students').where('enrollment_no','in',[body?.prn ||0,parseInt(body?.prn+'') ||0,parseInt(body?.emrollment_no+'') ||0,body?.emrollment_no ||0,]).get())

            if(!docs.empty){
                
               let headers =  ["registration_no",	"full_name",	"fname",	"mname",	"lname",	"dob",	"gender",	"mobile_no",	"email_id",	"category",	"father_name",	"mother_name",	"guradian_no",	"enrollment_no",	"adhar_card_no",	"c_address",	"city",	"pincode",	"handicap",	"student_medium"]

               let dat=Object.create({})
               headers.forEach(el=>{
                dat[el]=body[el]
               })
              let a  =   admin.firestore().doc('students/'+docs.docs?.[0].id).set(dat,{merge:true})
            }
 
       return  res.status(200).send({id:id,message:'Application submitted !!'});
    }catch(err){
      return  res.status(400).send({ message: 'Token Expired !!',status:400 ,err});
    }
   
});


module.exports = app;


