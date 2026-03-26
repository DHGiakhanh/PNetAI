const express = require("express");
const db = require("../models");
const { requireAuth, requireAnyRole } = require("../middlewares/rbac");

const router = express.Router();

router.post("/posts", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content is required" });

    const post = await db.Post.create({
      author: req.userId,
      content
    });

    res.status(201).json({ message: "Post created", post });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Timeline feed: own posts + posts from followed vets
router.get("/posts", requireAuth, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const skip = (page - 1) * limit;

    const following = await db.Follow.find({ follower: req.userId }).select("followee");
    const followingIds = following.map((f) => f.followee);
    followingIds.push(req.userId);

    const posts = await db.Post.find({
      author: { $in: followingIds },
      isRemoved: false
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name email role partnerType isVerified");

    const total = await db.Post.countDocuments({
      author: { $in: followingIds },
      isRemoved: false
    });

    res.status(200).json({
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get("/posts/:id", requireAuth, async (req, res) => {
  try {
    const post = await db.Post.findById(req.params.id)
      .populate("author", "name email role partnerType isVerified");

    if (!post || post.isRemoved) return res.status(404).json({ message: "Post not found" });

    const comments = await db.Comment.find({ post: post._id })
      .sort({ createdAt: -1 })
      .populate("user", "name email role");

    const likesCount = await db.Like.countDocuments({ post: post._id });
    const likedByMe = await db.Like.findOne({ post: post._id, user: req.userId });

    res.status(200).json({
      post,
      comments,
      likesCount,
      likedByMe: !!likedByMe
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put("/posts/:id", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content is required" });

    const post = await db.Post.findById(req.params.id);
    if (!post || post.isRemoved) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    post.content = content;
    post.updatedAt = Date.now();
    await post.save();

    res.status(200).json({ message: "Post updated", post });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/posts/:id", requireAuth, async (req, res) => {
  try {
    const post = await db.Post.findById(req.params.id);
    if (!post || post.isRemoved) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    post.isRemoved = true;
    post.updatedAt = Date.now();
    await post.save();

    res.status(200).json({ message: "Post removed" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Like/unlike
router.post("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await db.Post.findById(req.params.id);
    if (!post || post.isRemoved) return res.status(404).json({ message: "Post not found" });

    const like = await db.Like.findOneAndUpdate(
      { post: post._id, user: req.userId },
      { post: post._id, user: req.userId },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Liked", like });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/posts/:id/like", requireAuth, async (req, res) => {
  try {
    await db.Like.deleteOne({ post: req.params.id, user: req.userId });
    res.status(200).json({ message: "Unliked" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Comments
router.post("/posts/:id/comments", requireAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "content is required" });

    const post = await db.Post.findById(req.params.id);
    if (!post || post.isRemoved) return res.status(404).json({ message: "Post not found" });

    const comment = await db.Comment.create({
      post: post._id,
      user: req.userId,
      content
    });

    res.status(201).json({ message: "Comment created", comment });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/comments/:commentId", requireAuth, async (req, res) => {
  try {
    const comment = await db.Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.user.toString() !== req.userId && req.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    await db.Comment.findByIdAndDelete(req.params.commentId);
    res.status(200).json({ message: "Comment deleted" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Follow vets only
router.post("/follow/:userId", requireAuth, async (req, res) => {
  try {
    const target = await db.User.findById(req.params.userId);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role !== "partner" || target.partnerType !== "vet" || !target.isVerified) {
      return res.status(400).json({ message: "Only verified veterinarians can be followed" });
    }
    if (target._id.toString() === req.userId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const follow = await db.Follow.findOneAndUpdate(
      { follower: req.userId, followee: target._id },
      { follower: req.userId, followee: target._id },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "Followed", follow });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.delete("/follow/:userId", requireAuth, async (req, res) => {
  try {
    await db.Follow.deleteOne({ follower: req.userId, followee: req.params.userId });
    res.status(200).json({ message: "Unfollowed" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin moderation
router.delete("/posts/:id/moderate", requireAuth, requireAnyRole(["admin"]), async (req, res) => {
  try {
    const post = await db.Post.findById(req.params.id);
    if (!post || post.isRemoved) return res.status(404).json({ message: "Post not found" });
    post.isRemoved = true;
    post.updatedAt = Date.now();
    await post.save();
    await db.Like.deleteMany({ post: post._id });
    await db.Comment.deleteMany({ post: post._id });
    res.status(200).json({ message: "Post moderated and removed" });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;

