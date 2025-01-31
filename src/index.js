import { app } from "./app.js"
import dotenv from "dotenv"
import cors from "cors"
import connectDB from "./db/index.js"

dotenv.config()

const PORT = process.env.PORT || 8001

connectDB()
    .then(()=>{
        app.listen(8000, ()=> {
    console.log(`server is running on port ${PORT}`);
    
})
    })
    .catch((err) => {
    console.log("mongodb connection error", err);
    
})