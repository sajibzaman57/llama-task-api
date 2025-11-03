// routes/index.js

module.exports = function (app, router) {
    // Home/test route
    app.use('/api', require('./home.js')(router));

    // User routes
    app.use('/api/users', require('./user.js'));

    // Task routes 
    app.use('/api/tasks', require('./task.js')());
};