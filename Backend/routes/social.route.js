const express = require("express");
const db = require("../models");
const verifyToken = require("../middlewares/verifyToken");
const { emitToUser, emitToConversation, isUserOnline } = require("../services/socket.service");

const router = express.Router();

// ==========================================
// FRIENDSHIP ROUTING
// ==========================================

// Send a friend request
router.post("/friends/request", verifyToken, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    if (recipientId === req.userId) {
      return res.status(400).json({ message: "You cannot add yourself as a friend" });
    }

    const recipientUser = await db.User.findById(recipientId);
    if (!recipientUser) {
      return res.status(404).json({ message: "Recipient user not found" });
    }

    // Check existing friendship
    const existing = await db.Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: recipientId },
        { requester: recipientId, recipient: req.userId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "Already friends" });
      }
      if (existing.status === "pending") {
        if (existing.requester.toString() === req.userId) {
          return res.status(400).json({ message: "Friend request already sent" });
        } else {
          // If the other user already sent a request, auto-accept
          existing.status = "accepted";
          await existing.save();

          // Create notification for the other user
          const senderUser = await db.User.findById(req.userId);
          const notification = new db.Notification({
            user: recipientId,
            title: "Yêu cầu kết bạn được chấp nhận",
            message: `${senderUser.name} và bạn đã trở thành bạn bè.`,
            type: "info",
            relatedId: existing._id,
          });
          await notification.save();
          emitToUser(recipientId, "new_notification", notification);

          return res.status(200).json({ message: "Friend request accepted automatically", friendship: existing });
        }
      }
      // If rejected, allow re-request
      if (existing.status === "rejected") {
        existing.requester = req.userId;
        existing.recipient = recipientId;
        existing.status = "pending";
        await existing.save();

        const senderUser = await db.User.findById(req.userId);
        const notification = new db.Notification({
          user: recipientId,
          title: "Yêu cầu kết bạn mới",
          message: `${senderUser.name} đã gửi cho bạn một yêu cầu kết bạn.`,
          type: "info",
          relatedId: existing._id,
        });
        await notification.save();
        emitToUser(recipientId, "new_notification", notification);

        return res.status(200).json({ message: "Friend request sent successfully", friendship: existing });
      }
    }

    // Create new friend request
    const friendship = new db.Friendship({
      requester: req.userId,
      recipient: recipientId,
      status: "pending",
    });
    await friendship.save();

    // Create Notification
    const senderUser = await db.User.findById(req.userId);
    const notification = new db.Notification({
      user: recipientId,
      title: "Yêu cầu kết bạn mới",
      message: `${senderUser.name} đã gửi cho bạn một yêu cầu kết bạn.`,
      type: "info",
      relatedId: friendship._id,
    });
    await notification.save();
    emitToUser(recipientId, "new_notification", notification);

    res.status(201).json({ message: "Friend request sent successfully", friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept a friend request
router.post("/friends/accept", verifyToken, async (req, res) => {
  try {
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ message: "Requester ID is required" });
    }

    const friendship = await db.Friendship.findOne({
      requester: requesterId,
      recipient: req.userId,
      status: "pending",
    });

    if (!friendship) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    friendship.status = "accepted";
    await friendship.save();

    // Notify the requester
    const recipientUser = await db.User.findById(req.userId);
    const notification = new db.Notification({
      user: requesterId,
      title: "Yêu cầu kết bạn được chấp nhận",
      message: `${recipientUser.name} đã chấp nhận lời mời kết bạn của bạn.`,
      type: "info",
      relatedId: friendship._id,
    });
    await notification.save();
    emitToUser(requesterId, "new_notification", notification);

    res.status(200).json({ message: "Friend request accepted", friendship });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reject a friend request
router.post("/friends/reject", verifyToken, async (req, res) => {
  try {
    const { requesterId } = req.body;

    if (!requesterId) {
      return res.status(400).json({ message: "Requester ID is required" });
    }

    // Delete friendship request completely so users can request again in future if they want
    const result = await db.Friendship.findOneAndDelete({
      requester: requesterId,
      recipient: req.userId,
      status: "pending",
    });

    if (!result) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    res.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cancel a sent friend request
router.post("/friends/cancel", verifyToken, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ message: "Recipient ID is required" });
    }

    const result = await db.Friendship.findOneAndDelete({
      requester: req.userId,
      recipient: recipientId,
      status: "pending",
    });

    if (!result) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    res.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unfriend a user
router.delete("/friends/:friendId", verifyToken, async (req, res) => {
  try {
    const { friendId } = req.params;

    const result = await db.Friendship.findOneAndDelete({
      $or: [
        { requester: req.userId, recipient: friendId, status: "accepted" },
        { requester: friendId, recipient: req.userId, status: "accepted" },
      ],
    });

    if (!result) {
      return res.status(404).json({ message: "Friendship not found" });
    }

    res.status(200).json({ message: "Unfriended successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get friend list
router.get("/friends", verifyToken, async (req, res) => {
  try {
    const friendships = await db.Friendship.find({
      $or: [
        { requester: req.userId, status: "accepted" },
        { recipient: req.userId, status: "accepted" },
      ],
    }).populate("requester recipient", "name email avatarUrl phone role description");

    const friends = friendships.map((f) => {
      const other = f.requester._id.toString() === req.userId ? f.recipient : f.requester;
      const otherObj = other.toObject();
      return {
        ...otherObj,
        friendshipId: f._id,
        onlineStatus: isUserOnline(other._id) ? "online" : "offline",
      };
    });

    res.status(200).json({ friends });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get received pending friend requests
router.get("/friends/requests/pending", verifyToken, async (req, res) => {
  try {
    const requests = await db.Friendship.find({
      recipient: req.userId,
      status: "pending",
    }).populate("requester", "name email avatarUrl role description");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get sent pending friend requests
router.get("/friends/requests/sent", verifyToken, async (req, res) => {
  try {
    const requests = await db.Friendship.find({
      requester: req.userId,
      status: "pending",
    }).populate("recipient", "name email avatarUrl role description");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search users & return friendship status relative to logged-in user
router.get("/users/search", verifyToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(200).json({ users: [] });
    }

    // Search query for matching name or email, excluding self
    const query = {
      _id: { $ne: req.userId },
      role: "user", // Let's restrict searching to basic users for general friends
      $or: [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ],
    };

    const users = await db.User.find(query)
      .select("name email avatarUrl role description")
      .limit(30);

    const userIds = users.map((u) => u._id);

    // Fetch friendships involving these users
    const friendships = await db.Friendship.find({
      $or: [
        { requester: req.userId, recipient: { $in: userIds } },
        { requester: { $in: userIds }, recipient: req.userId },
      ],
    });

    const mappedUsers = users.map((u) => {
      const userObj = u.toObject();
      const fs = friendships.find(
        (f) =>
          (f.requester.toString() === req.userId && f.recipient.toString() === u._id.toString()) ||
          (f.requester.toString() === u._id.toString() && f.recipient.toString() === req.userId)
      );

      let status = "none";
      if (fs) {
        if (fs.status === "accepted") {
          status = "friends";
        } else if (fs.status === "pending") {
          status = fs.requester.toString() === req.userId ? "pending_sent" : "pending_received";
        }
      }

      return {
        ...userObj,
        friendshipStatus: status,
      };
    });

    res.status(200).json({ users: mappedUsers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// CONVERSATION & MESSAGING ROUTING
// ==========================================

// Get conversations of the logged-in user
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const conversations = await db.Conversation.find({
      participants: req.userId,
    })
      .populate("participants", "name email avatarUrl role description")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatarUrl" },
      })
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map((convo) => {
      const otherParticipant = convo.participants.find(
        (p) => p._id.toString() !== req.userId
      );
      
      const convoObj = convo.toObject();

      // Check if conversation has unread messages for this user
      let unreadCount = 0;
      if (convo.lastMessage) {
        const isNotSender = convo.lastMessage.sender._id.toString() !== req.userId;
        const hasNotRead = !convo.lastMessage.readBy.map(id => id.toString()).includes(req.userId);
        if (isNotSender && hasNotRead) {
          unreadCount = 1; // Simplify to 1 if last message is unread, or we could run a db count
        }
      }

      return {
        ...convoObj,
        otherParticipant: otherParticipant
          ? {
              ...otherParticipant.toObject(),
              onlineStatus: isUserOnline(otherParticipant._id) ? "online" : "offline",
            }
          : null,
        unreadCount,
      };
    });

    res.status(200).json({ conversations: formattedConversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start or retrieve a 1-to-1 conversation
router.post("/conversations", verifyToken, async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ message: "Participant ID is required" });
    }

    if (participantId === req.userId) {
      return res.status(400).json({ message: "You cannot start a chat with yourself" });
    }

    // Check if 1-to-1 conversation already exists
    let conversation = await db.Conversation.findOne({
      isGroup: false,
      participants: { $all: [req.userId, participantId] },
    });

    if (!conversation) {
      conversation = new db.Conversation({
        participants: [req.userId, participantId],
        isGroup: false,
      });
      await conversation.save();
    }

    // Populate and format response
    const populated = await db.Conversation.findById(conversation._id)
      .populate("participants", "name email avatarUrl role description")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name avatarUrl" },
      });

    const otherParticipant = populated.participants.find(
      (p) => p._id.toString() !== req.userId
    );

    const convoObj = populated.toObject();
    const formatted = {
      ...convoObj,
      otherParticipant: otherParticipant
        ? {
            ...otherParticipant.toObject(),
            onlineStatus: isUserOnline(otherParticipant._id) ? "online" : "offline",
          }
        : null,
      unreadCount: 0,
    };

    res.status(200).json({ conversation: formatted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Fetch messages for a conversation with pagination
router.get("/conversations/:conversationId/messages", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, before } = req.query;

    const limitNum = parseInt(limit, 10);

    // Verify user is a participant of the conversation
    const conversation = await db.Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.map((p) => p.toString()).includes(req.userId)) {
      return res.status(403).json({ message: "Access denied. You are not in this chat." });
    }

    const query = { conversation: conversationId };
    
    // Support infinite scrolling: fetch messages before a specific timestamp/id
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await db.Message.find(query)
      .populate("sender", "name avatarUrl")
      .sort({ createdAt: -1 }) // Get newest first
      .limit(limitNum);

    // Reverse to chronological order for client representation
    res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message
router.post("/conversations/:conversationId/messages", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, attachments } = req.body;

    if (!text && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: "Message content or attachment is required" });
    }

    const conversation = await db.Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.map((p) => p.toString()).includes(req.userId)) {
      return res.status(403).json({ message: "Access denied. You are not in this chat." });
    }

    // Create and save message
    const message = new db.Message({
      conversation: conversationId,
      sender: req.userId,
      text,
      attachments,
      readBy: [req.userId],
    });
    await message.save();

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.updatedAt = Date.now();
    await conversation.save();

    // Populate sender details for emit
    const populatedMessage = await db.Message.findById(message._id).populate(
      "sender",
      "name avatarUrl"
    );

    // Broadcast message to room
    emitToConversation(conversationId, "new_message", populatedMessage);

    // Notify other participants (to update unread badge on their chat icon if they aren't actively in this conversation room)
    conversation.participants.forEach((participantId) => {
      const pIdStr = participantId.toString();
      if (pIdStr !== req.userId) {
        emitToUser(pIdStr, "chat_message_notification", {
          conversationId,
          message: populatedMessage,
        });
      }
    });

    res.status(201).json({ message: populatedMessage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark conversation messages as read
router.patch("/conversations/:conversationId/read", verifyToken, async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await db.Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.map((p) => p.toString()).includes(req.userId)) {
      return res.status(403).json({ message: "Access denied. You are not in this chat." });
    }

    // Add req.userId to readBy array for all messages in this conversation where they aren't already included
    await db.Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.userId },
        readBy: { $ne: req.userId },
      },
      {
        $addToSet: { readBy: req.userId },
      }
    );

    // Emit read receipt event to conversation
    emitToConversation(conversationId, "message_read", {
      conversationId,
      userId: req.userId,
    });

    res.status(200).json({ message: "Conversation marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
