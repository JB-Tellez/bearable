const PORT = 3000;
const app = require('./lib/app');

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);

app.listen(PORT, () => console.log('Listening on PORT', PORT));
