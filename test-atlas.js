const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
const variableName = process.env.MONGODB_URI ? "MONGODB_URI" : "MONGO_URI";

async function main() {
  console.log("Using", variableName);

  if (!mongoUri) {
    throw new Error("MONGODB_URI or MONGO_URI is required");
  }

  try {
    await mongoose.connect(mongoUri);

    console.log("CONNECTED");
    console.log("Database:", mongoose.connection.db.databaseName);

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:");
    collections.forEach((collection) => {
      console.log("-", collection.name);
    });
  } catch (error) {
    console.error("MongoDB error:", error);
    console.error("Error code:", error.code);
    console.error("errorResponse:", error.errorResponse);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
