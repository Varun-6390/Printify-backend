const Department = require('../Models/Department');
const express = require('express')
const router = express.Router();

router.get('/',async(req,res)=>{
    const dept = await Department.find();
    return res.json(dept)
})


router.delete('/:id',async(req,res)=>{
    const dept = await Department.findByIdAndDelete(req.params.id)
    return res.json("Deleted Succesfully")
})

router.post('/',async(req,res)=>{
    const dept = await new Department(req.body);
    dept.save();
    return res.json(req.body);  
})  

router.put('/:id',async(req,res)=>
{
    const dept = await Department.findByIdAndUpdate(req.params.id,req.body)
    return res.json("Updated  Successfully")

})

module.exports = router;