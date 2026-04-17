const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Get all blogs with filters (Public only sees APPROVED)
router.get('/', async (req, res) => {
    try {
        const { category, search, page = 1, limit = 10 } = req.query;
        
        // Public only sees approved blogs
        let query = { status: "approved" };
        
        if (category) query.category = category;
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }
        
        const skip = (page - 1) * limit;
        const blogs = await db.Blog.find(query)
            .populate('author', 'name avatarUrl role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));
            
        const total = await db.Blog.countDocuments(query);
        res.status(200).json({
            blogs,
            pagination: { total, page: Number(page), pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get My Blogs (For the logged-in user)
router.get('/my-blogs', verifyToken, async (req, res) => {
    try {
        const blogs = await db.Blog.find({ author: req.userId })
            .sort({ createdAt: -1 });
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get hot posts (Approved only)
router.get('/hot', async (req, res) => {
    try {
        const blogs = await db.Blog.find({ isHot: true, status: "approved" })
            .populate('author', 'name avatarUrl')
            .sort({ views: -1 })
            .limit(5);
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get latest posts (Approved only)
router.get('/latest', async (req, res) => {
    try {
        const blogs = await db.Blog.find({ status: "approved" })
            .populate('author', 'name avatarUrl')
            .sort({ createdAt: -1 })
            .limit(5);
        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get blog by ID
router.get('/:id', async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id)
            .populate('author', 'name email avatarUrl address phone description')
            .populate('comments.user', 'name avatarUrl')
            .populate('comments.replies.user', 'name avatarUrl');
        
        if (!blog) return res.status(404).json({ message: "Blog not found" });
        
        // Increment views for approved posts only
        if (blog.status === "approved") {
            blog.views += 1;
            await blog.save();
        }
        
        res.status(200).json({ blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like/Unlike blog post
router.post('/:id/like', verifyToken, async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        const likeIndex = blog.likes.indexOf(req.userId);
        if (likeIndex === -1) {
            blog.likes.push(req.userId);
        } else {
            blog.likes.splice(likeIndex, 1);
        }

        await blog.save();
        res.status(200).json({ likes: blog.likes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Comment on blog post
router.post('/:id/comment', verifyToken, async (req, res) => {
    try {
        const { text, image } = req.body;
        if (!text) return res.status(400).json({ message: "Comment text is required" });

        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        const newComment = {
            user: req.userId,
            text,
            image,
            createdAt: new Date()
        };

        blog.comments.push(newComment);
        await blog.save();

        const updatedBlog = await db.Blog.findById(req.params.id)
            .populate('comments.user', 'name avatarUrl')
            .populate('comments.replies.user', 'name avatarUrl');
        
        res.status(201).json({ comments: updatedBlog.comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Reply to a comment
router.post('/:id/comment/:commentId/reply', verifyToken, async (req, res) => {
    try {
        const { text, image } = req.body;
        if (!text) return res.status(400).json({ message: "Reply text is required" });

        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        const comment = blog.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const newReply = {
            user: req.userId,
            text,
            image,
            createdAt: new Date()
        };

        comment.replies.push(newReply);
        await blog.save();

        const updatedBlog = await db.Blog.findById(req.params.id)
            .populate('comments.user', 'name avatarUrl')
            .populate('comments.replies.user', 'name avatarUrl');
        
        res.status(201).json({ comments: updatedBlog.comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Like/Unlike a comment
router.post('/:id/comment/:commentId/like', verifyToken, async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        const comment = blog.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        const likeIndex = comment.likes.indexOf(req.userId);
        if (likeIndex === -1) {
            comment.likes.push(req.userId);
        } else {
            comment.likes.splice(likeIndex, 1);
        }

        await blog.save();

        const updatedBlog = await db.Blog.findById(req.params.id)
            .populate('comments.user', 'name avatarUrl')
            .populate('comments.replies.user', 'name avatarUrl');

        res.status(200).json({ comments: updatedBlog.comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete a comment (author of comment or admin)
router.delete('/:id/comment/:commentId', verifyToken, async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        const comment = blog.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: "Comment not found" });

        // Only the comment author or admin can delete
        if (req.role !== 'admin' && comment.user.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. Not the comment author." });
        }

        blog.comments.pull(req.params.commentId);
        await blog.save();

        const updatedBlog = await db.Blog.findById(req.params.id)
            .populate('comments.user', 'name avatarUrl')
            .populate('comments.replies.user', 'name avatarUrl');

        res.status(200).json({ comments: updatedBlog.comments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const BLACKLIST_KEYWORDS = [
    "scam", "fraud", "hack", "bot", "spam", "abuse", "hate", "phân biệt", "lừa đảo", 
    "chửi", "đụ", "má", "đếch", "vãi", "cứt", "đéo", "đĩ", "điếm", "ma tuý", "cờ bạc"
];

const checkBlacklist = (title, content) => {
    const combined = `${title} ${content}`.toLowerCase();
    const foundKeywords = BLACKLIST_KEYWORDS.filter(word => combined.includes(word.toLowerCase()));
    return foundKeywords;
};

// Create/Draft blog (Any logged-in user)
router.post('/', verifyToken, async (req, res) => {
    try {
        const { title, content, category, image, status } = req.body;
        
        let finalStatus = status || 'draft';
        let autoNote = "";

        // If trying to publish, check blacklist
        if (finalStatus === 'pending') {
            const violations = checkBlacklist(title, content);
            if (violations.length > 0) {
                finalStatus = 'rejected';
                autoNote = `Automated Rejection: Content contains forbidden language (${violations.join(", ")}).`;
            }
        }

        const blog = new db.Blog({
            title, content, category, image,
            status: finalStatus,
            reviewNote: autoNote,
            author: req.userId
        });
        
        await blog.save();
        
        const message = finalStatus === 'rejected' 
            ? "Submission rejected due to content policy violations." 
            : "Blog saved successfully";

        res.status(201).json({ message, blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update blog (Author or Admin)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        // Authorization check
        if (req.role !== 'admin' && blog.author.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. Not the author." });
        }

        // Apply updates
        const updatableFields = ['title', 'content', 'category', 'image', 'status'];
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) blog[field] = req.body[field];
        });

        // Check blacklist if moving to pending
        if (blog.status === 'pending') {
            const violations = checkBlacklist(blog.title, blog.content);
            if (violations.length > 0) {
                blog.status = 'rejected';
                blog.reviewNote = `Automated Rejection: Content contains forbidden language (${violations.join(", ")}).`;
            }
        }

        blog.updatedAt = Date.now();
        await blog.save();
        
        const message = blog.status === 'rejected' 
            ? "Update flagged and rejected due to content policy violations." 
            : "Blog updated successfully";

        res.status(200).json({ message, blog });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete blog (Author or Admin)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const blog = await db.Blog.findById(req.params.id);
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        if (req.role !== 'admin' && blog.author.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied. Not the author." });
        }

        await db.Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
