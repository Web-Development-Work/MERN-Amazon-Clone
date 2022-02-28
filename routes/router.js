const express = require("express");
const router = new express.Router();
const products = require("../models/productsSchema");
const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const authenicate = require("../middleware/authenticate");

// router.get("/",(req,res)=>{
//     res.send("this is testing routes");
// });


// get the products data

router.get("/getproducts", async (req, res) => {
    try {
        const producstdata = await products.find();
        res.status(201).json(producstdata);
    } catch (error) {
        console.log("error" + error.message);
    } 
});


// register the data
router.post("/register", async (req, res) => {
    // console.log(req.body);
    const { fname, email, mobile, password, cpassword } = req.body;

    if (!fname || !email || !mobile || !password || !cpassword) {
        res.status(422).json({ error: "fill the all details" });
    };

    try {

        const preuser = await User.findOne({ email: email });

        if (preuser) {
            res.status(422).json({ error: "This email is already exist" });
        } else if (password !== cpassword) {
            res.status(422).json({ error: "password are not matching" });;
        } else {

            const finaluser = new User({
                fname, email, mobile, password, cpassword
            });

            // hahsing
            const storedata = await finaluser.save();
            res.status(201).json({storedata,message:"user successfully added"});
        }

    } catch (error) {
        res.status(422).send(error);
    }

});



// login data
router.post("/login", async (req, res) => {
    // console.log(req.body);
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "fill the details" });
    }

    try {

        const userlogin = await User.findOne({ email: email });
        if (userlogin) {
            const isMatch = await bcrypt.compare(password, userlogin.password);

            const token = await userlogin.generatAuthtoken();

            res.cookie("eccomerce", token, {
                expires: new Date(Date.now() + 2589000),
                httpOnly: true
            });

            if (!isMatch) {
                res.status(400).json({ error: "invalid crediential pass" });
            } else {
                res.status(201).json(userlogin);
            }

        } else {
            res.status(400).json({ error: "user not exist" });
        }

    } catch (error) {
        res.status(400).json({ error: "invalid crediential pass" });
    }
});

// getindividual

router.get("/getproductsone/:id", async (req, res) => {

    try {
        const { id } = req.params;

        const individual = await products.findOne({ id: id });

        res.status(201).json(individual);
    } catch (error) {
        res.status(400).json(error);
    }
});


// adding the data into cart
router.post("/addcart/:id", authenicate, async (req, res) => {

    try {
        console.log("perfect 6");
        const { id } = req.params;
        const cart = await products.findOne({ id: id });

        const Usercontact = await User.findOne({_id:req.userID});


        if (Usercontact) {
            const cartData = await Usercontact.addcartdata(cart);

            await Usercontact.save();
            res.status(201).json(Usercontact);
        }
    } catch (error) {
        console.log(error);
    }
});


// get data into the cart
router.get("/cartdetails",authenicate,async(req,res)=>{
    try {
        const buyuser = await User.findOne({_id:req.userID});
        res.status(201).json(buyuser);
    } catch (error) {
        console.log(error+"error for buy now");
    }
});



// get user is login or not
router.get("/validuser",authenicate,async(req,res)=>{
    try {
        const validuserone = await User.findOne({_id:req.userID});
        res.status(201).json(validuserone);
    } catch (error) {
        console.log(error+"error for valid user");
    }
});

// for userlogout

router.get("/logout",authenicate,async(req,res)=>{
    try {
        req.rootUser.tokens = req.rootUser.tokens.filter((curelem)=>{
            return curelem.token !== req.token
        });

        res.clearCookie("eccomerce",{path:"/"});
        req.rootUser.save();
        res.status(201).json(req.rootUser.tokens);

    } catch (error) {
        console.log(error + "jwt provide then logout");
    }
});


// remove iteam from the cart

router.get("/remove/:id",authenicate,async(req,res)=>{
    try {
        const {id} = req.params;

        req.rootUser.carts = req.rootUser.carts.filter((curel)=>{
            return curel.id !=id
        });

        req.rootUser.save();
        res.status(201).json(req.rootUser);
        console.log("item remove successfully");

    } catch (error) {
        console.log(error + "jwt provide then remove");
        res.status(400).json(error);
    }
});


module.exports = router;