const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const secretKey = 'your-secret-key'; // Cambia esto por una clave secreta segura

app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // tu contraseña de MySQL
  database: 'floreser'
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected...');
});

app.post('/register', (req, res) => {
  const { email, username, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = 'INSERT INTO users (email, username, password) VALUES (?, ?, ?)';
  db.query(sql, [email, username, hashedPassword], (err, result) => {
    if (err) throw err;
    res.send('User registered');
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.query(sql, [username], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.status(404).send('User not found');

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) return res.status(401).send('Invalid password');

    const token = jwt.sign({ id: user.id }, secretKey, {
      expiresIn: 86400 // 24 hours
    });

    res.send({ auth: true, token });
  });
});

app.get('/user-info', (req, res) => {
  const token = req.headers['x-access-token'];
  if (!token) return res.status(401).send('No token provided');

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(500).send('Failed to authenticate token');

    const sql = 'SELECT email, username FROM users WHERE id = ?';
    db.query(sql, [decoded.id], (err, results) => {
      if (err) throw err;
      if (results.length === 0) return res.status(404).send('User not found');
      res.send(results[0]);
    });
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
