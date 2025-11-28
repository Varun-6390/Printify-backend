const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require("dotenv").config();

const app = express();
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000;

const URL = process.env.MONGODB_URI || "mongodb://localhost:27017/printify";

mongoose.connect(URL)
    .then(()=>{
        console.log("Database Connected")
    })
    .catch(()=>{
        console.log("Not Connected")
    })

//API

app.use('/api/user',require('./Routes/userRoute'))
app.use('/api/admin',require('./Routes/adminRoute'))
app.use('/api/order',require('./Routes/orderRoute'))
app.use('/api/department',require('./Routes/departmentRoute'))
app.use('/api/section',require('./Routes/sectionRoute'))
app.use("/api/settings",require('./Routes/settingsRoute'));

app.listen(PORT || 5000,()=>{
    console.log("Server is running");
})