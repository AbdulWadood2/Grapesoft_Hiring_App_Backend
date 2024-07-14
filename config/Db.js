const mongoose = require("mongoose");

const connectionDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDb Connected`);
  } catch (e) {
    console.log("Error connecting Db : ", e.message);
    process.exit(1);
  }
};

module.exports = connectionDb;
