const User = require('../Models/User');
const Order = require('../Models/Order');
const express = require('express');
const router = express.Router();


router.post('/',async(req,res)=>{
    const user = await new User(req.body);
    user.save();
    return res.json("Register Successfully");
})


router.get('/',async(req,res)=>{
    const user = await User.find();
    return res.json(user);
})

router.get('/:id', async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    return res.json(user);
})

router.post('/login',async(req,res)=>{
    const {email, password} = req.body;
    const result = await User.findOne({email:email});
    console.log(result)
    if(!result){
        return res.json({message:'Details not found'});
    }
    if (password==result.password)
    {
        return res.json({message:"Login Success",user:{
            role:"user",
            email:result.email,
            id:result._id,
            name:result.name
        }})
        
    }   else{
            return res.json({message:"Enter Correct Password"});
        
    }
})

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // remove all orders related to this user
    await Order.deleteMany({ user: userId });

    return res.json({
      message: "User and related orders deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});



router.put('/change/:id', async (req, res) => {
    const { op, np, cnp } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
        return res.json("User Not Found");
    }
    if (!(user.password == op)) {
        return res.json("old password not matched")
    }
    if (op == np) {
        return res.json("Old and new Password are same")
    } else {
        if (np == cnp) {
            try {
                const u = await User.findByIdAndUpdate(req.params.id, { password: cnp })
                return res.json("Password changed successfuly")
            } catch (er) {
                console.log(er)
            }
        } else {
            return res.json(" new password and confirm new password not matched")
        }
    }
})
module.exports = router