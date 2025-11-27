const Section = require('../Models/Section');
const express = require('express');
const router = express.Router();

router.get('/',async(req,res)=>{
    const section = await Section.find();
    return res.json(section)
})

router.delete('/:id',async(req,res)=>{
    const section = await Section.findByIdAndDelete(req.params.id)
    return res.json("Deleted Succesfully")
})

router.post('/',async(req,res)=>{
    const section = await new Section(req.body);
    section.save();
    return res.json(req.body);
}) 
 
router.put('/:id',async(req,res)=>
{
    const section = await Section.findByIdAndUpdate(req.params.id,req.body)
    return res.json("Updated  Successfully")

})

module.exports = router;