const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const ErrorHandler = require("../utils/ErrorHandler");

// register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      userName: name,
      email: email,
      password: hashedPassword,
    });

    await user.save();

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error,
    });
  }
});

// register
router.post("/login", async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if (!user) {
      return next(new ErrorHandler("please enter email and password", 404));
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return next(new ErrorHandler("entered password is wrong", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error,
    });
  }
});

// // logout user
// router.get("/logout", async(req,res) => {
//   const {userId} = req.body;
  
// })

module.exports = router;
