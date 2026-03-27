const mongoose = require('mongoose');
require('dotenv').config();
const db = require('../models');

// Category data
const categories = [
  {
    name: "Food",
    description: "Premium pet food, treats, and nutritional supplements for dogs and cats",
    icon: "🍖",
    color: "#F59E0B",
    sortOrder: 1
  },
  {
    name: "Toys",
    description: "Interactive toys, balls, and entertainment items to keep your pets active and happy",
    icon: "🎾",
    color: "#3B82F6",
    sortOrder: 2
  },
  {
    name: "Accessories",
    description: "Collars, harnesses, beds, bowls, and other essential pet accessories",
    icon: "🎀",
    color: "#EC4899",
    sortOrder: 3
  },
  {
    name: "Health",
    description: "Health supplements, medications, and wellness products for your pet's wellbeing",
    icon: "💊",
    color: "#10B981",
    sortOrder: 4
  },
  {
    name: "Grooming",
    description: "Brushes, shampoos, nail clippers, and grooming tools for pet hygiene",
    icon: "✂️",
    color: "#8B5CF6",
    sortOrder: 5
  },
  {
    name: "Travel",
    description: "Carriers, car seats, and travel accessories for safe pet transportation",
    icon: "🧳",
    color: "#F97316",
    sortOrder: 6
  }
];

async function seedCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing categories
    await db.Category.deleteMany({});
    console.log('Cleared existing categories');

    // Insert new categories
    const insertedCategories = await db.Category.insertMany(categories);
    console.log(`Successfully inserted ${insertedCategories.length} categories`);

    // Display categories
    console.log('\nCategories added:');
    insertedCategories.forEach(category => {
      console.log(`- ${category.icon} ${category.name}: ${category.description}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

// Run the seed function
seedCategories();