const router = require("express").Router();
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const bcrypt = require("bcrypt");

// update user
router.put("/:id", async (req, res) => {
  let { userId, password } = req.body;
  if (userId === req.params.id || req.body.isAdmin) {
    if (password) {
      try {
        const salt = await bcrypt.genSalt(10);
        req.body.password = await bcrypt.hash(password, salt);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: error,
        });
      }
    }

    try {
      const user = await User.findByIdAndUpdate(userId, {
        $set: req.body,
      });
      res.status(200).json({
        success: true,
        message: "account has been updated",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  }
  //   if (password) {
  // } else {
  //   return res.status(401).json({
  //     success: false,
  //     message: "you can only update your account",
  //   });
  // }
});

// delete user
router.delete("/:id", async (req, res) => {
  let { userId } = req.body;
  if (userId === req.params.id || req.body.isAdmin) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "account not found",
        });
      }
      return res.status(200).json({
        success: true,
        message: "account has been deleted successfully",
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: error,
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: "you can only delete your account",
    });
  }
});

// get a user
router.get("/", async (req, res) => {
  const userId = req.query.userId;
  const username = req.query.username;
  try {
    const user = userId
      ? await User.findById(userId)
      : await User.findOne({ userName: username });
    if (user) {
      const { password, updatedAt, ...others } = user._doc;
      res.status(200).json({
        success: true,
        user: others,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error,
    });
  }
});

// get Friends
router.get("/friends/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    const friends = await Promise.all(
      user.followings.map((friendId) => {
        return User.findById(friendId);
      })
    );

    let friendList = [];
    friends.map((friend) => {
      const { _id, userName, profilePicture } = friend;
      friendList.push({ _id, userName, profilePicture });
    });

    res.status(200).json({
      sucsess: true,
      friendList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error,
    });
  }
});

// follow a user
router.put("/:id/follow", async (req, res) => {
  const { userId } = req.body;
  if (userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(userId);
      if (!user.followers.includes(userId)) {
        await user.updateOne({ $push: { followers: userId } });
        await currentUser.updateOne({ $push: { followings: req.params.id } });
        const conversation = await Conversation.findOne({
          members: { $all: [req.params.id, userId] },
        });
        if (!conversation) {
          const newConversation = new Conversation({
            members: [req.params.id, userId],
          });

          const savedConversation = await newConversation.save();
        }
        res.status(200).json({
          success: true,
          message: "account has been followed",
        });
      } else {
        res.status(403).json({
          success: false,
          message: "you are already following this account",
        });
      }
    } catch (error) {}
  } else {
    res.status(403).json({
      success: false,
      message: "you cannot follow yourself",
    });
  }
});
// unfollow a user
router.put("/:id/unfollow", async (req, res) => {
  const { userId } = req.body;
  if (userId !== req.params.id) {
    try {
      const user = await User.findById(req.params.id);
      const currentUser = await User.findById(userId);
      if (user.followers.includes(userId)) {
        await user.updateOne({ $pull: { followers: userId } });
        await currentUser.updateOne({ $pull: { followings: req.params.id } });
        res.status(200).json({
          success: true,
          message: "account has been unfollowed",
        });
      } else {
        res.status(403).json({
          success: false,
          message: "account not found",
        });
      }
    } catch (error) {}
  } else {
    res.status(403).json({
      success: false,
      message: "you cannot unfollow yourself",
    });
  }
});

router.get("/search/:name", async (req, res) => {
  try {
    const query = {
      userName: {
        $regex: req.params.name,
        $options: "i",
      },
    };

    const users = await User.find(
      { ...query },
      { userName: 1, profilePicture: 1 }
    );
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error,
    });
  }
});

router.get("/search", async (req, res) => {
  try {
    const users = await User.find({}, { userName: 1, profilePicture: 1 });
    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      error,
    });
  }
});

module.exports = router;
