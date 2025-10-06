import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.set("debug", true);
    
    mongoose.connection.on("connected", () => console.log("Database Connected"));
  
    await mongoose.connect(`${process.env.MONGODB_URI}/lms`);
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
