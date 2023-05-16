const router = require("express").Router();
const Post = require("../models/Post");
const User = require("../models/User");

//create a post

router.post("/", async (req, res) => {
  const newPost = new Post(req.body);
  try {
    const savedPost = await newPost.save();
    res.status(200).json({
      success: true,
      savedPost,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});
//update a post

router.put("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.updateOne({ $set: req.body });
      res.status(200).json({
        success: true,
        message: "post has been updated",
      });
    } else {
      res.status(403).json({
        success: false,
        message: "you can update only your post",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});
//delete a post

router.delete("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.userId === req.body.userId) {
      await post.deleteOne();
      res.status(200).json({
        success: true,
        message: "the post has been deleted",
      });
    } else {
      res.status(403).json({
        success: false,
        message: "you can delete only your post",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});
//like / dislike a post

router.put("/:id/like", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post.likes.includes(req.body.userId)) {
      await post.updateOne({ $push: { likes: req.body.userId } });
      res.status(200).json({
        success: true,
        message: "The post has been liked",
      });
    } else {
      await post.updateOne({ $pull: { likes: req.body.userId } });
      res.status(200).json({
        success: true,
        message: "The post has been disliked",
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});
//get a post

router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    res.status(200).json({
      success: true,
      post,
    });
  } catch (err) {
    res.status(500).json(err);
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});

//get timeline posts

router.get("/timeline/:userId", async (req, res) => {
  try {
    const currentUser = await User.findById(req.params.userId);
    const userPosts = await Post.find({ userId: currentUser._id });
    const friendPosts = await Promise.all(
      currentUser.followings.map((friendId) => {
        return Post.find({ userId: friendId });
      })
    );
    res.status(200).json({
      success: true,
      posts: userPosts.concat(...friendPosts)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err,
    });
  }
});

// get All posts of user
router.get("/profile/:username", async (req, res) => {
  try {
    const user = await User.findOne({ userName: req.params.username });
    const posts = await Post.find({ userId: user._id });
    res.status(200).json({
      success: true,
      posts,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      err,
    });
  }
});

module.exports = router;
