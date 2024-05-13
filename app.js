require('./jwt/generateKey');
const express = require('express');
const app = express();
const authRoutes = require('./routes/authRoutes');
const db = require('./database/db');
db.connect();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Express Server');
});

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
