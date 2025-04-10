const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('./config/db');
const usersRoutes = require('./routes/users');
const restaurantsRoutes = require('./routes/restaurants');
const reservationsRoutes = require('./routes/reservations');
const chatRoutes = require('./routes/chat');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', usersRoutes);
app.use('/api/restaurants', restaurantsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));