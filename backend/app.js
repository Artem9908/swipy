const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');

app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter); 