import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/mongodb.js";
import { clerkWebhooks } from "./controllers/webhook.js";
import educatorRouter from "./routes/educatorRoute.js";
import { clerkMiddleware } from "@clerk/express";
import connectCloudinary from "./configs/cloudinary.js";

const app = express();

await connectDB();
await connectCloudinary()

app.use(cors());
app.use(clerkMiddleware())

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.post("/clerk", express.json(), clerkWebhooks);
app.use('/api/educator', express.json(), educatorRouter)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`app running ${PORT}`);
});
