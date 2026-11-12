const mongoose = require('mongoose')

let dbName = "SPCDB"
mongoose.connect(process.env.DB);
let db = mongoose.connection
db.on('error', err => { console.error(err) });
db.once('open', () => {
  console.log(`Connected to Database ${dbName}`)
});
process.on('SIGINT', () => {
  db.close()
    .then(() => {
      console.log(`Closing connection to ${dbName}`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`Error closing connection to ${dbName}`, err);
      process.exitCode = 1;
    });
});



module.exports = db;