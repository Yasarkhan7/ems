const express = require('express')
const app = express()
const cors = require('cors')
app.use(cors())
app.use(express.json())
const bodyParser = require('body-parser');
app.use(bodyParser.json());


const NodeCache = require('node-cache'); // Import the node-cache library
const myCache = new NodeCache({ stdTTL: 60 });

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'user',
    password: 'Yasarkhan22@',
    database: 'ems'
  });

  var db;
  (async () => {
    try {
      db = await pool.getConnection();
      
      console.log('Successfully connected to MySQL!');
      db.release(); // Release the connection back to the pool
    } catch (error) {
      console.error('Error connecting to MySQL:', error.stack);
      process.exit(1); // Exit the application if the connection fails
    }
  })();

  app.get('/get',async (req,res)=>{


    const [result] = await pool.execute(
        'INSERT INTO products (name, price) VALUES (?, ?)',
        ['Yasar', 2300]
      );
    
    console.log(result)
    res.status(200).send({message:'hello eee'})
})
app.get('/get2',async (req,res)=>{
    const [rows] = await pool.execute('SELECT * FROM products');

    console.log(rows)
    res.status(200).send({message:'hello eee'})
})

app.listen(3000,()=>{
console.log('listening...')
})