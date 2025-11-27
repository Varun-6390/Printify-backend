const Order = require('../Models/Order')

const express = require('express')
const router = express.Router();

router.get('/:id', async(req,res)=>{
    const  pendingOrder = await Order.countDocuments({status: 'pending'})
    const  completeOrder = await Order.countDocuments({status: 'completed'})
    return res.json({ pendingOrder: pendingOrder, completeOrder: completeOrder})
})

module.exports = router;