const mongoose=require("mongoose");
const userSchema=new mongoose.Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobileNo:{
        type:String,
    },
    role:{
        type:String,
        enum:['admin', 'user'],
        default:'user'
    },
    verified:{
        type:Boolean,
        default:false
    },
    
},{
    timestamps:true
});

module.exports=mongoose.model("User",userSchema);
