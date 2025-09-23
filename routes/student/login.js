const express = require('express');
const app = express.Router();
const getDB = require('../../credentials/index');
const jwt = require('jsonwebtoken');

var pool ;
pool =  getDB.pool;

const KEY = 'CC12FFJH12BUSPAS####@$!@12131';

// Middleware to parse JSON bodies with an increased size limit
app.use(express.json({ limit: '50mb' }));
// A function to ensure the database is initialized before accepting requests
async function initializeDatabase() {
    try {
        console.log('Dropping old students table if it exists...');
        await pool.execute('DROP TABLE IF EXISTS students;');
        console.log('Old students table dropped.');

        console.log('Creating new students table...');
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
initializeDatabase();

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

        console.log(data)
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
    const { token, course, scheme, semester, branch } = req.query;

    try {
        jwt.verify(token, KEY);
        const data = require('../../data/subjects.json');
        let dat = data?.[course]?.[branch]?.[semester]?.[scheme];

        if (dat) {
            res.status(200).send(dat);
        } else {
            res.status(404).send({ message: 'No data found !' });
        }
    } catch (err) {
        res.status(401).send({ message: 'Invalid or expired Token' });
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

// View all students (for debugging or administrative purposes)
app.get('/viewtoken', async (req, res) => {
    try {
        const [data] = await pool.execute('SELECT * FROM students');
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send({ message: err.message });
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
    try {
        res.status(200).send(req.file.filename);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

app.get('/uploads/:filename',async (req, res) => {
    try {

        const filePath = __dirname?.replace('/routes/student','')+'/uploads/'+ req.params.filename; // Construct the absolute file path

        console.log(filePath)
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Error sending file:', err);
            res.status(404).send({ message: 'File not found.' });
        }
    });


        // res.status(200).send(req.file.filename);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

module.exports = app;
