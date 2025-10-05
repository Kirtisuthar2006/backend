// require('dotenv').config({path: './env'})
import express from "express";
import dotenv from "dotenv";
import { DB_NAME } from "./constants.js";  // ✅ added .js extension
import connectDB from "./db/index.js"; 
import { app } from "./app.js";
    // ✅ already correct

dotenv.config({
path: './.env',
});

// Start DB connection
connectDB()
.then(()=>{
    app.listen(process.env.PORT ||8000 , ()=> {
        console.log(`Server is running at Port  ${process.env.PORT}`);
    })

})
.catch((error)=>{
    console.log("Error connecting to database", error);

})


















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
