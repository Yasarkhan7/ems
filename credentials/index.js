const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'user',
    password: 'Yasarkhan22@',
    database: 'ems'
  });

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


module.exports =  {pool}