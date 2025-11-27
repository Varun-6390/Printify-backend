const Admin = require('../Models/Admin');
const Order = require('../Models/Order');
const User = require('../Models/User');
const express = require('express');
const router = express.Router();


router.post('/',async(req,res)=>{
    const admin = await new Admin(req.body);
    admin.save();
    return res.json(req.body);
})

router.post('/login',async(req,res)=>{
    const {email, password} = req.body;
    const result = await Admin.findOne({email:email});
    if(!result){
        return res.json({message:'Details not found'});
    }
    if (password==result.password)
    {
        return res.json({message:"Login Success",admin:{
            role:"admin",
            email:result.email,
            id:result._id,
            name:result.name
        }})
        
    }   else{
            return res.json({message:"Enter Correct Password"});
          
    }
})

// STATS API
router.get("/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ "printOptions.status": "pending" });

    // SUM revenue
    const revenueData = await Order.find();
    let revenue = 0;
    revenueData.forEach(order => {
      revenue += Number(order.printOptions.price || 0);
    });

    res.json({
      users: totalUsers,
      orders: totalOrders,
      pending: pendingOrders,
      revenue: revenue
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching stats" });
  }
});


router.put('/change/:id', async(req,res)=>{
    const {op,np,cnp}  = req.body;
    const admin = await Admin.findById(req.params.id);
    if(!admin){
        return res.json("Admin Not Found");
    }
    if(!(admin.password==op)){
        return res.json("old password not matched")
    }
    if(op==np){
        return res.json("Old and new Password are same")
    }else{
        if(np==cnp){
            try{
                const u = await Admin.findByIdAndUpdate(req.params.id,{password:cnp})
            return res.json("Password changed successfuly")
            }catch(er){
                console.log(er)
            }
        }else{
            return res.json(" new password and confirm new password not matched")
        }
    }
})

module.exports = router;