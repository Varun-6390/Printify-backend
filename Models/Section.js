const mongoose = require('mongoose');
const router = require('../Routes/userRoute');

const sectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },    
},
    {
        timestamps:true
    })

module.exports = mongoose.model('section',sectionSchema);