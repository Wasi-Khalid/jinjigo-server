const mongoose = require('mongoose');

function connect() {
    const uri = process.env.MONGODB_URI;
    mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to MongoDB Atlas');
        })
        .catch((error) => {
            console.error('Error connecting to MongoDB Atlas:', error);
            process.exit(1);
        });
}

module.exports = { connect };
