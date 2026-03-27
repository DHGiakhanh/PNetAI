const mongoose = require('mongoose');
require('dotenv').config();
const db = require('../models');

// Sample service data for pet services
const services = [
  // Grooming Services
  {
    title: "Full Grooming Package",
    description: "Complete grooming service including bath, haircut, nail trimming, ear cleaning, and teeth brushing. Perfect for keeping your pet looking and feeling their best.",
    category: "Grooming",
    basePrice: 65.00,
    duration: 120, // 2 hours
    images: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Professional bath with premium shampoo",
      "Breed-specific haircut and styling",
      "Nail trimming and filing",
      "Ear cleaning and inspection",
      "Teeth brushing",
      "Blow dry and brushing"
    ],
    isPopular: true,
    averageRating: 4.8,
    totalReviews: 156,
    location: {
      address: "123 Pet Grooming St",
      city: "San Francisco",
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hours: { start: "09:00", end: "17:00" }
    }
  },
  {
    title: "Express Bath & Brush",
    description: "Quick and efficient bath and brush service for pets who need a refresh. Includes basic nail trim and ear check.",
    category: "Grooming",
    basePrice: 35.00,
    duration: 60, // 1 hour
    images: [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Gentle bath with hypoallergenic shampoo",
      "Thorough brushing and de-shedding",
      "Basic nail trim",
      "Ear cleaning",
      "Quick blow dry"
    ],
    isPopular: false,
    averageRating: 4.5,
    totalReviews: 89,
    location: {
      address: "456 Quick Clean Ave",
      city: "San Francisco",
      coordinates: { lat: 37.7849, lng: -122.4094 }
    },
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      hours: { start: "08:00", end: "18:00" }
    }
  },
  {
    title: "Luxury Spa Treatment",
    description: "Premium spa experience for your pet including aromatherapy bath, deep conditioning treatment, massage, and premium styling.",
    category: "Grooming",
    basePrice: 95.00,
    duration: 180, // 3 hours
    images: [
      "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Aromatherapy bath with essential oils",
      "Deep conditioning fur treatment",
      "Relaxing massage therapy",
      "Premium styling and finishing",
      "Nail art (optional)",
      "Cologne and bow tie finishing"
    ],
    isPopular: true,
    averageRating: 4.9,
    totalReviews: 67,
    location: {
      address: "789 Luxury Pet Spa Blvd",
      city: "San Francisco",
      coordinates: { lat: 37.7649, lng: -122.4294 }
    },
    availability: {
      days: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      hours: { start: "10:00", end: "16:00" }
    }
  },

  // Veterinary Services
  {
    title: "Comprehensive Health Checkup",
    description: "Complete veterinary examination including physical assessment, vaccinations, and health consultation. Essential for maintaining your pet's health.",
    category: "Veterinary",
    basePrice: 85.00,
    duration: 45,
    images: [
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Complete physical examination",
      "Vaccination updates",
      "Weight and vital signs check",
      "Dental health assessment",
      "Parasite screening",
      "Health consultation and advice"
    ],
    isPopular: true,
    averageRating: 4.7,
    totalReviews: 234,
    location: {
      address: "321 Veterinary Care Dr",
      city: "San Francisco",
      coordinates: { lat: 37.7549, lng: -122.4394 }
    },
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      hours: { start: "08:00", end: "17:00" }
    }
  },
  {
    title: "Emergency Vet Consultation",
    description: "Urgent veterinary care for pets in distress. Available for emergency situations and immediate health concerns.",
    category: "Veterinary",
    basePrice: 120.00,
    duration: 30,
    images: [
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Immediate assessment",
      "Emergency treatment",
      "Pain management",
      "Diagnostic testing if needed",
      "Treatment plan consultation",
      "Follow-up care instructions"
    ],
    isPopular: false,
    averageRating: 4.6,
    totalReviews: 78,
    location: {
      address: "555 Emergency Pet Care St",
      city: "San Francisco",
      coordinates: { lat: 37.7449, lng: -122.4494 }
    },
    availability: {
      days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      hours: { start: "00:00", end: "23:59" }
    }
  },
  {
    title: "Dental Cleaning Service",
    description: "Professional dental cleaning and oral health care for pets. Includes scaling, polishing, and oral health assessment.",
    category: "Veterinary",
    basePrice: 150.00,
    duration: 90,
    images: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Professional dental scaling",
      "Tooth polishing",
      "Oral health examination",
      "Dental X-rays if needed",
      "Fluoride treatment",
      "Dental care instructions"
    ],
    isPopular: false,
    averageRating: 4.8,
    totalReviews: 45,
    location: {
      address: "888 Pet Dental Center Ave",
      city: "San Francisco",
      coordinates: { lat: 37.7349, lng: -122.4594 }
    },
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      hours: { start: "09:00", end: "15:00" }
    }
  },

  // Training Services
  {
    title: "Basic Obedience Training",
    description: "Fundamental training program covering basic commands, leash walking, and behavioral correction. Perfect for puppies and new pet owners.",
    category: "Training",
    basePrice: 75.00,
    duration: 60,
    images: [
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Basic command training (sit, stay, come)",
      "Leash walking techniques",
      "House training guidance",
      "Behavioral assessment",
      "Socialization tips",
      "Take-home training materials"
    ],
    isPopular: true,
    averageRating: 4.6,
    totalReviews: 123,
    location: {
      address: "999 Pet Training Academy Rd",
      city: "San Francisco",
      coordinates: { lat: 37.7249, lng: -122.4694 }
    },
    availability: {
      days: ["Tuesday", "Thursday", "Saturday", "Sunday"],
      hours: { start: "10:00", end: "16:00" }
    }
  },
  {
    title: "Advanced Behavioral Training",
    description: "Specialized training for behavioral issues including aggression, anxiety, and advanced obedience. One-on-one sessions with certified trainers.",
    category: "Training",
    basePrice: 110.00,
    duration: 90,
    images: [
      "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?q=80&w=400&auto=format&fit=crop"
    ],
    features: [
      "Behavioral assessment and analysis",
      "Customized training plan",
      "Aggression management techniques",
      "Anxiety reduction methods",
      "Advanced obedience commands",
      "Owner education and support"
    ],
    isPopular: false,
    averageRating: 4.9,
    totalReviews: 34,
    location: {
      address: "777 Advanced Pet Training Center",
      city: "San Francisco",
      coordinates: { lat: 37.7149, lng: -122.4794 }
    },
    availability: {
      days: ["Monday", "Wednesday", "Friday", "Saturday"],
      hours: { start: "09:00", end: "17:00" }
    }
  }
];

async function seedServices() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing services
    await db.Service.deleteMany({});
    console.log('Cleared existing services');

    // Insert new services
    const insertedServices = await db.Service.insertMany(services);
    console.log(`Successfully inserted ${insertedServices.length} services`);

    // Display summary
    const categories = [...new Set(services.map(s => s.category))];
    console.log('\nService categories added:');
    categories.forEach(category => {
      const count = services.filter(s => s.category === category).length;
      console.log(`- ${category}: ${count} services`);
    });

    console.log('\nPopular services:', services.filter(s => s.isPopular).length);
    console.log('Total services:', services.length);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding services:', error);
    process.exit(1);
  }
}

// Run the seed function
seedServices();