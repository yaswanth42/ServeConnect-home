const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Category = require('../models/Category');
const Service = require('../models/Service');

const categoriesData = [
  { name: 'Electrician', description: 'Expert electrical services including wiring, switches, lighting, and repairs.', icon: 'Zap' },
  { name: 'Plumber', description: 'Professional plumbing repairs, leak fixes, pipe fittings, and installation.', icon: 'Droplet' },
  { name: 'Carpenter', description: 'Furniture making, assembly, wooden doors/windows repair, and custom carpentry.', icon: 'Hammer' },
  { name: 'AC Repair', description: 'Air conditioner servicing, gas filling, repair, and installation.', icon: 'Wind' },
  { name: 'Appliance Repair', description: 'Fixing microwave, television, geyser, and small home appliances.', icon: 'Cpu' },
  { name: 'Cleaning', description: 'House cleaning, sofa sanitization, kitchen deep cleaning, and dusting services.', icon: 'Sparkles' },
  { name: 'Pest Control', description: 'Safe and effective pest control for termites, bedbugs, cockroaches, and rodents.', icon: 'ShieldAlert' },
  { name: 'Painting', description: 'Premium interior and exterior wall painting, waterproof coatings, and textures.', icon: 'Paintbrush' },
  { name: 'Water Purifier & RO Service', description: 'RO filter replacement, repair, service, and installation.', icon: 'Filter' },
  { name: 'Home Deep Cleaning', description: 'Intensive deep sanitation for full house including bathrooms and kitchens.', icon: 'Home' },
  { name: 'Washing Machine Repair', description: 'Top load, front load, semi-automatic washing machine repair and service.', icon: 'Wrench' },
  { name: 'Refrigerator Repair', description: 'Double door, single door, side-by-side fridge repair and gas refills.', icon: 'IceCream' },
  { name: 'CCTV Installation', description: 'Security camera setup, DVR configuration, wiring, and maintenance.', icon: 'Camera' },
  { name: 'Salon & Beautician at Home', description: 'Premium haircut, facial, massage, waxing, and bridal beauty services at home.', icon: 'Scissors' }
];

const servicesData = [
  // Electrician
  { categoryName: 'Electrician', name: 'Ceiling Fan Installation', description: 'Mounting and connection of ceiling fans safely.', price: 299, duration: 30 },
  { categoryName: 'Electrician', name: 'Short Circuit Repair', description: 'Diagnose and fix power cuts, flickering lights, and fuse issues.', price: 599, duration: 60 },
  { categoryName: 'Electrician', name: 'Switchboard Replacement', description: 'Install new switches, sockets, and faceplates.', price: 199, duration: 25 },
  
  // Plumber
  { categoryName: 'Plumber', name: 'Leaking Pipe & Tap Repair', description: 'Fix dripping taps, pipes under sinks, and bathroom leakages.', price: 249, duration: 30 },
  { categoryName: 'Plumber', name: 'Drain Unblocking', description: 'Clear clogged drains in kitchen, bathroom, or basin.', price: 399, duration: 45 },
  { categoryName: 'Plumber', name: 'Bathroom Fittings Installation', description: 'Install shower heads, mixers, faucets, and vanity mirrors.', price: 499, duration: 60 },

  // Carpenter
  { categoryName: 'Carpenter', name: 'Furniture Assembly', description: 'Assemble beds, wardrobes, study tables, or drawers.', price: 799, duration: 120 },
  { categoryName: 'Carpenter', name: 'Door Lock Installation', description: 'Install new handles, cylinders, or mortise locks.', price: 299, duration: 40 },
  
  // AC Repair
  { categoryName: 'AC Repair', name: 'AC Wet Service', description: 'Complete filter cleaning, indoor coil wash, and outdoor unit servicing.', price: 499, duration: 45 },
  { categoryName: 'AC Repair', name: 'AC Gas Charging', description: 'Leak testing and complete gas refilling for efficient cooling.', price: 1500, duration: 90 },

  // Cleaning
  { categoryName: 'Cleaning', name: 'Bathroom Deep Cleaning', description: 'Thorough tiles cleaning, toilet sanitization, and grout scrub.', price: 349, duration: 60 },
  { categoryName: 'Cleaning', name: 'Sofa Cleaning (per seat)', description: 'Dry vacuuming, shampooing, and wet vacuuming of fabric sofa.', price: 199, duration: 30 },

  // Home Deep Cleaning
  { categoryName: 'Home Deep Cleaning', name: '1 BHK Full House Deep Cleaning', description: 'Thorough sanitization, dusting, floor scrubbing, kitchen, and bathroom deep wash.', price: 1999, duration: 240 },
  { categoryName: 'Home Deep Cleaning', name: '2 BHK Full House Deep Cleaning', description: 'Thorough deep cleaning and disinfection of rooms, kitchen, and washrooms.', price: 2999, duration: 360 },

  // Salon
  { categoryName: 'Salon & Beautician at Home', name: 'Classic Facial & Grooming', description: 'Deep cleansing facial with massage and face mask application.', price: 899, duration: 50 },
  { categoryName: 'Salon & Beautician at Home', name: 'Haircut & Styling', description: 'Professional haircut, wash, blow dry, and style at home.', price: 399, duration: 45 }
];

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/serveconnect';
    console.log(`Connecting to database for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('Clearing existing categories and services...');
    await Category.deleteMany();
    await Service.deleteMany();

    console.log('Seeding Categories...');
    const seededCategories = await Category.create(categoriesData);
    console.log(`Successfully seeded ${seededCategories.length} categories.`);

    console.log('Seeding Services...');
    const serviceDocs = [];
    for (const service of servicesData) {
      const categoryDoc = seededCategories.find(cat => cat.name === service.categoryName);
      if (categoryDoc) {
        serviceDocs.push({
          category: categoryDoc._id,
          name: service.name,
          description: service.description,
          price: service.price,
          duration: service.duration,
          image: service.image || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=300&h=200&q=80'
        });
      }
    }

    const seededServices = await Service.insertMany(serviceDocs);
    console.log(`Successfully seeded ${seededServices.length} services.`);

    console.log('Database Seeding Completed Successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedDB();
