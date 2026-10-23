import mongoose from "mongoose";

const  connectDb = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(process.env.MONGODB_URI)
        console.log('db connected !')

    }catch(err){
       console.log(err)
    }

}

export default connectDb