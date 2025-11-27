const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "user",
        // required:true
    },
    fileURL:{
        type:String, 
        // required:true
    },
    printOptions:{
        color:{
            type:String,
            enum:['color','bw'],
            default:'bw',
            // required:true
        },
        sides:{
            type:String,
            enum:['single','double'],
            default:'single',
            // required:true
        },
        copies:{
            type:Number,
            default:1
        },
        status:{  
            type:String,
            enum:['pending','completed','cancelled'],
            default:'pending',
            // required:true
        },
        price:{
            type:Number,  
            // required:true
        }
    }
},
    {
        timestamps:true
    })

module.exports = mongoose.model('order',orderSchema);    