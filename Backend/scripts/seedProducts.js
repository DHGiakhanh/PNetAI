const mongoose = require('mongoose');
require('dotenv').config();
const db = require('../models');

// Sample product data for pet store
const products = [
  // Food & Treats
  {
    name: "Premium Organic Dog Food",
    description: "High-quality organic dog food made with real chicken and vegetables. Perfect for adult dogs of all sizes.",
    price: 45.99,
    category: "Food",
    images: [
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 50,
    isHot: true,
    isRecommended: true,
    averageRating: 4.8,
    totalReviews: 124
  },
  {
    name: "Salmon Training Treats",
    description: "Delicious salmon-flavored training treats. Perfect for positive reinforcement training sessions.",
    price: 12.99,
    category: "Food",
    images: [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 75,
    isHot: false,
    isRecommended: true,
    averageRating: 4.6,
    totalReviews: 89
  },
  {
    name: "Natural Cat Food - Chicken & Rice",
    description: "Premium cat food with real chicken and rice. Specially formulated for indoor cats.",
    price: 38.50,
    category: "Food",
    images: [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 40,
    isHot: false,
    isRecommended: false,
    averageRating: 4.4,
    totalReviews: 67
  },

  // Toys
  {
    name: "Interactive Puzzle Toy",
    description: "Mental stimulation puzzle toy that challenges your dog's problem-solving skills. Great for reducing boredom.",
    price: 24.99,
    category: "Toys",
    images: [
      "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 30,
    isHot: true,
    isRecommended: false,
    averageRating: 4.7,
    totalReviews: 156
  },
  {
    name: "Squeaky Rubber Ball",
    description: "Durable rubber ball with squeaker inside. Perfect for fetch and interactive play.",
    price: 8.99,
    category: "Toys",
    images: [
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 100,
    isHot: false,
    isRecommended: true,
    averageRating: 4.3,
    totalReviews: 203
  },
  {
    name: "Catnip Mouse Toy Set",
    description: "Set of 3 catnip-filled mouse toys. Drives cats crazy with excitement and provides hours of entertainment.",
    price: 15.99,
    category: "Toys",
    images: [
      "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 60,
    isHot: false,
    isRecommended: false,
    averageRating: 4.5,
    totalReviews: 78
  },

  // Accessories
  {
    name: "Adjustable Dog Harness",
    description: "Comfortable and secure adjustable harness. Perfect for daily walks and training. Available in multiple sizes.",
    price: 29.99,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 45,
    isHot: true,
    isRecommended: true,
    averageRating: 4.9,
    totalReviews: 312
  },
  {
    name: "Stainless Steel Food Bowl",
    description: "Durable stainless steel food bowl with non-slip base. Easy to clean and dishwasher safe.",
    price: 18.50,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1679224106783-c21b1841412a?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 80,
    isHot: false,
    isRecommended: true,
    averageRating: 4.6,
    totalReviews: 145
  },
  {
    name: "Cozy Pet Bed - Large",
    description: "Ultra-soft and comfortable pet bed. Machine washable with removable cover. Perfect for large dogs.",
    price: 65.99,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1541188495357-ad2dc89487f4?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 25,
    isHot: false,
    isRecommended: true,
    averageRating: 4.8,
    totalReviews: 89
  },
  {
    name: "LED Safety Collar",
    description: "Rechargeable LED collar for nighttime visibility. Keeps your pet safe during evening walks.",
    price: 22.99,
    category: "Accessories",
    images: [
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 35,
    isHot: true,
    isRecommended: false,
    averageRating: 4.4,
    totalReviews: 67
  },

  // Health & Care
  {
    name: "Natural Flea & Tick Shampoo",
    description: "Gentle, natural shampoo that repels fleas and ticks. Made with essential oils and safe ingredients.",
    price: 16.99,
    category: "Health",
    images: [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 55,
    isHot: false,
    isRecommended: true,
    averageRating: 4.5,
    totalReviews: 134
  },
  {
    name: "Dental Chew Sticks",
    description: "Natural dental chews that help clean teeth and freshen breath. Vet recommended for oral health.",
    price: 19.99,
    category: "Health",
    images: [
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 70,
    isHot: false,
    isRecommended: false,
    averageRating: 4.3,
    totalReviews: 98
  },

  // Grooming
  {
    name: "Professional Pet Brush",
    description: "High-quality grooming brush suitable for all coat types. Reduces shedding and keeps fur healthy.",
    price: 14.99,
    category: "Grooming",
    images: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 90,
    isHot: false,
    isRecommended: true,
    averageRating: 4.7,
    totalReviews: 167
  },
  {
    name: "Nail Clipper Set",
    description: "Professional-grade nail clippers with safety guard. Includes file for smooth finishing.",
    price: 11.99,
    category: "Grooming",
    images: [
      "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 65,
    isHot: false,
    isRecommended: false,
    averageRating: 4.2,
    totalReviews: 45
  },

  // Travel & Carriers
  {
    name: "Airline Approved Pet Carrier",
    description: "TSA approved pet carrier for air travel. Comfortable and secure with mesh windows for ventilation.",
    price: 89.99,
    category: "Travel",
    images: [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 20,
    isHot: true,
    isRecommended: true,
    averageRating: 4.6,
    totalReviews: 78
  },
  {
    name: "Car Safety Harness",
    description: "Crash-tested car safety harness. Keeps your pet secure during car rides. Easy to install.",
    price: 34.99,
    category: "Travel",
    images: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop"
    ],
    stock: 40,
    isHot: false,
    isRecommended: true,
    averageRating: 4.8,
    totalReviews: 156
  }
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing products
    await db.Product.deleteMany({});
    console.log('Cleared existing products');

    // Insert new products
    const insertedProducts = await db.Product.insertMany(products);
    console.log(`Successfully inserted ${insertedProducts.length} products`);

    // Display summary
    const categories = [...new Set(products.map(p => p.category))];
    console.log('\nCategories added:');
    categories.forEach(category => {
      const count = products.filter(p => p.category === category).length;
      console.log(`- ${category}: ${count} products`);
    });

    console.log('\nHot products:', products.filter(p => p.isHot).length);
    console.log('Recommended products:', products.filter(p => p.isRecommended).length);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

// Run the seed function
seedProducts();