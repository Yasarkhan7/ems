const express = require('express');
const app = express.Router();
const getDB = require('../../credentials/index');
const jwt = require('jsonwebtoken');

var pool ;
pool =  getDB.pool;

const KEY = 'CC12FFJH12BUSPAS####@$!@12131';
var admin = require("firebase-admin");


// Middleware to parse JSON bodies with an increased size limit
app.use(express.json({ limit: '100mb' }));
// A function to ensure the database is initialized before accepting requests
async function initializeDatabase() {
    try {
        // console.log('Dropping old students table if it exists...');
        await pool.execute('DROP TABLE IF EXISTS students;');
        // console.log('Old students table dropped.');

        // console.log('Creating new students table...');
        await pool.execute(`
            CREATE TABLE students (
            pid INT NOT NULL AUTO_INCREMENT,
            registration_no VARCHAR(255),
            full_name VARCHAR(255),
            fname VARCHAR(255),
            mname VARCHAR(255),
            lname VARCHAR(255),
            dob  VARCHAR(255),
            gender VARCHAR(50),
            mobile_no VARCHAR(20),
            email_id VARCHAR(255),
            category VARCHAR(100),
            father_name VARCHAR(255),
            mother_name VARCHAR(255),
            guradian_no VARCHAR(20),
            enrollment_no VARCHAR(255) UNIQUE,
            tc_date  VARCHAR(255),
            adhar_card_no VARCHAR(20),
            c_address TEXT,
            p_address TEXT,
            city VARCHAR(100),
            pincode VARCHAR(10),
            p_date  VARCHAR(255),
            handicap VARCHAR(50),
            course VARCHAR(100),
            year  VARCHAR(255),
            sem  VARCHAR(255),
            pwd VARCHAR(255),
            academic_year VARCHAR(50),
            student_medium VARCHAR(50),
            PRIMARY KEY (pid)
        );
        `);
        console.log('Students table created successfully.');
    } catch (error) {
        console.error('Database initialization failed:', error);
    }
}

// Call the initialization function to set up the table on startup
// initializeDatabase();

// Route to add data from the Excel file
app.post('/addData', async (req, res) => {
    // The query string is sent in a property named 'query'
    const { query } = req.body;

    if (!query) {
        return res.status(400).send({ message: 'No query string provided.' });
    }

    try {
        const [result] = await pool.execute(query);
        console.log('Database insertion successful:', result);
        res.status(200).send({ message: 'Data added successfully.', result });
    } catch (error) {
        console.error('Error inserting data:', error);
        res.status(400).send({ message: error.message });
    }
});

// Login with Enrollment Number (PRN)
app.get('/login', async (req, res) => {
    const { type, prn } = req.query;

    if (!type || !prn) {
        return res.status(400).send({ message: 'Restricted Access !!' });
    }

    try {
        // Use a parameterized query to prevent SQL injection
         
        const data = (await pool.execute('SELECT * FROM students WHERE enrollment_no = '+ prn))?.[0]?.[0]

        // console.log(data)
        if (!data) {
            return res.status(404).send({ message: 'User not found.' });
        }

        let token = jwt.sign({ ...data, type, prn }, KEY, { expiresIn: '6h' });

        res.status(200).send({ name: data?.full_name, token, type, prn });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send({ message: 'An error occurred during login.' });
    }
});

// Get subjects based on course details
app.get('/getSubjects', async (req, res) => {
    const { token,scheme, semester, branch } = req.query;

    try {
        jwt.verify(token, KEY);
        const data = require('../../data/subjects.json');

        const filt = []

        data.forEach(el=>{
            if(el.semester==semester && scheme==el.scheme && (!branch  || branch==el.branch))
                filt.push(el)
        })
            //    console.log(filt)


        if (filt.length>0) {
            res.status(200).send(filt);
        } else {
            res.status(404).send({ message: 'No data found !' });
        }
    } catch (err) {
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
        // let tok = jwt.verify(req.query?.token,KEY)

     
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


app.get('/submitApplication',async (req, res) => {

    const body = req.body
    try{
        let tok = jwt.verify(req.query?.token,KEY)

     let a =await   pool.execute(`INSERT INTO applications (
  abc_id,
  academic_year,
  adhar_card_no,
  branch,
  c_address,
  category,
  city,
  code_1,
  code_2,
  code_3,
  code_4,
  code_5,
  code_6,
  course,
  dob,
  email_id,
  enrollment_no,
  exam,
  father_name,
  fname,
  full_name,
  gender,
  guardian_no,
  handicap,
  image_link,
  lname,
  mname,
  mobile_no,
  mother_name,
  p_address,
  p_code_1,
  p_code_2,
  p_code_3,
  p_code_4,
  pincode,
  practical_1,
  practical_2,
  practical_3,
  practical_4,
  registration_no,
  sem,
  semester,
  sign,
  student_medium,
  subject_1,
  subject_2,
  subject_3,
  subject_4,
  subject_5,
  subject_6,
  type,
  year,
  fee_amount,
  paid_amount,
  paid_date,
  late_amount,
  invoiceID,
  status
) VALUES (
  ${body.abc_id ||''},
 ${body.academic_year || new Date().getFullYear().toString()},
         ${body.adhar_card_no ||'NULL'},
 ${body.branch ||'NULL'},
     ${body.c_address ||'NULL'},
     ${body.category ||'NULL'},
     ${body.city ||'NULL'},
     ${body.code_1 ||'NULL'},
          ${body.code_2 ||'NULL'},
     ${body.code_3 ||'NULL'},
     ${body.code_4 ||'NULL'},
     ${body.code_5 ||'NULL'},
     ${body.code_6 ||'NULL'},
     ${body.course ||'NULL'},
     ${body.dob ||'NULL'},
     ${body.email_id ||'NULL'},
     ${body.enrollment_no ||'NULL'},
     ${body.exam ||'NULL'},
     ${body.father_name ||'NULL'},

          ${body.fname ||'NULL'},
     ${body.full_name ||'NULL'},
     ${body.gender ||'NULL'},
     ${body.guardian_no ||'NULL'},
     ${body.handicap ||'NULL'},
     ${body.image_link ||'NULL'},
     ${body.lname ||'NULL'},
     ${body.mname ||'NULL'},
     ${body.mobile_no ||'NULL'},
     ${body.mother_name ||'NULL'},
     ${body.p_address ||'NULL'},
     ${body.p_code_1 ||'NULL'},
     ${body.p_code_2 ||'NULL'},
     ${body.p_code_3 ||'NULL'},
     ${body.p_code_4 ||'NULL'},
     ${body.pincode ||'NULL'},
     ${body.practical_1 ||'NULL'},
     ${body.practical_2||'NULL'},
     ${body.practical_3 ||'NULL'},
     ${body.practical_4 ||'NULL'},
     ${body.registration_no ||'NULL'},
     ${body.semester ||'NULL'},
     ${body.sign ||'NULL'},
     ${body.student_medium ||'NULL'},
     ${body.subject_1 ||'NULL'},
     ${body.subject_2 ||'NULL'},
     ${body.subject_3 ||'NULL'},
     ${body.subject_4 ||'NULL'},
     ${body.subject_5 ||'NULL'},
     ${body.subject_6 ||'NULL'},
     ${body.type ||'NULL'},
     ${body.fee_amount ||0},
    ${body.paid_amount ||0},

    ${body.paid_date ||0},
     ${body.late_amount ||0},
     ${body.invoiceID ||"NULL"},
     PENDING
);`).then(el=>{
    console.log(el)
})
     
       return  res.status(200).send({message:'Done'});
    }catch(err){
      return  res.status(500).send({ message: err });

    }
   
});


module.exports = app;



async function createapplicationtable(){
pool.execute(`
CREATE TABLE IF NOT EXISTS applications (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  abc_id VARCHAR(255),
  academic_year VARCHAR(255),
  adhar_card_no VARCHAR(255),
  branch VARCHAR(255),
  c_address TEXT,
  category VARCHAR(255),
  city VARCHAR(255),
  code_1 VARCHAR(255),
  code_2 VARCHAR(255),
  code_3 VARCHAR(255),
  code_4 VARCHAR(255),
  code_5 VARCHAR(255),
  code_6 VARCHAR(255),
  course VARCHAR(255),
  dob VARCHAR(255),
  email_id VARCHAR(255),
  enrollment_no VARCHAR(255),
  exam VARCHAR(255),
  father_name VARCHAR(255),
  fname VARCHAR(255),
  full_name VARCHAR(255),
  gender VARCHAR(255),
  guardian_no VARCHAR(255),
  handicap VARCHAR(255),
  image_link VARCHAR(255),
  lname VARCHAR(255),
  mname VARCHAR(255),
  mobile_no VARCHAR(255),
  mother_name VARCHAR(255),
  p_address TEXT,
  p_code_1 VARCHAR(255),
  p_code_2 VARCHAR(255),
  p_code_3 VARCHAR(255),
  p_code_4 VARCHAR(255),
  pincode VARCHAR(255),
  practical_1 VARCHAR(255),
  practical_2 VARCHAR(255),
  practical_3 VARCHAR(255),
  practical_4 VARCHAR(255),
  registration_no VARCHAR(255),
  semester VARCHAR(255),
  sign VARCHAR(255),
  student_medium VARCHAR(255),
  subject_1 VARCHAR(255),
  subject_2 VARCHAR(255),
  subject_3 VARCHAR(255),
  subject_4 VARCHAR(255),
  subject_5 VARCHAR(255),
  subject_6 VARCHAR(255),
  type VARCHAR(255),
  created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fee_amount INT NOT NULL,
  paid_amount INT,
  paid_date VARCHAR(255),
  late_amount INT,
  invoiceID VARCHAR(255),
  status VARCHAR(255)
);`).then(el=>{
    console.log(el)
})

}

createapplicationtable()
