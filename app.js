require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path'); 

const docsRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());

app.use('/', docsRoutes);
app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.redirect('/auth/login');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
