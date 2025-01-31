import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv"

dotenv.config()

const connectDB = async () => {
    try {

        console.log(process.env.MONGODB_URL);
        

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    
            console.log(`\n MongoDB connected ! DB host:${connectionInstance.connection.host}`);
            
        
    } catch (error) {
        console.log("MONGODB CONNECTION ERROR," , error);
        process.exit(1) 
        
    }
}

export default  connectDB