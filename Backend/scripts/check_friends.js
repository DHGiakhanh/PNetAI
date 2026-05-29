const mongoose = require("mongoose");
const connectDB = require("../config/db");
const db = require("../models");

async function checkFriendsRoute() {
  await connectDB();
  try {
    const reqUserId = "69c7560ac6022c16595578c5"; // "Tui là Lẹo"
    
    const friendships = await db.Friendship.find({
      $or: [
        { requester: reqUserId, status: "accepted" },
        { recipient: reqUserId, status: "accepted" },
      ],
    }).populate("requester recipient", "name email avatarUrl phone role description");

    console.log("Found accepted friendships count:", friendships.length);

    const friends = friendships.map((f) => {
      // Check if both are populated
      if (!f.requester || !f.recipient) {
        console.log("Friendship contains null user:", f._id);
        return null;
      }
      
      const other = f.requester._id.toString() === reqUserId ? f.recipient : f.requester;
      const otherObj = other.toObject();
      return {
        ...otherObj,
        friendshipId: f._id,
        onlineStatus: "offline", // Mock online checking
      };
    }).filter(Boolean);

    console.log("=== MAPPED FRIENDS ROUTE OUTPUT ===");
    console.log(JSON.stringify(friends, null, 2));

  } catch (error) {
    console.error("Error running route simulation:", error);
  } finally {
    await mongoose.connection.close();
  }
}

checkFriendsRoute();
