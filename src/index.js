// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";  // ✅ added .js extension
import connectDB from "./db/index.js"; 
    // ✅ already correct

dotenv.config({
path: './.env',
});

// Start DB connection
connectDB()



















/*

import express from "express"

const app = express()

;( async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}`)
        app.on("error", (error) => {
        console.log("Error connecting to database", error);
        throw error;
        })

        app.listen(process.env.PORT,()=>{
        console.log(`Server started at port ${process.env.PORT}`);
        })
    }
    catch(error){
        console.log("ERROR",error)
        throw error;

    }
})()*/
