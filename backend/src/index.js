import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";























/*
import express from "express";
const app = express();

(async ()=>{
  try {
    await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
    app.on("error", (error)=>{
      console.log("error", error);
      throw error;
    })

    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running on port ${process.env.PORT || 8000}`);
    });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
})()
*/