/**
 * Seed script to add test properties
 * Run with: node scripts/seedProperties.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Property = require('../src/models/Property');
const User = require('../src/models/User');

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

const testProperties = [
  {
    title: 'Luxury 3-Bedroom Apartment in Victoria Island',
    description: 'Beautiful modern apartment with stunning ocean views. Features include fully furnished living spaces, modern kitchen, and spacious bedrooms. Located in the heart of Victoria Island with easy access to shopping centers and business districts.',
    location: 'Lagos',
    price: 4500000,
    apartmentType: 'Apartments / Flats',
    bedrooms: 3,
    bathrooms: 2,
    totalArea: 180,
    amenities: ['Swimming Pool', 'Gym', 'Parking', 'Security', '24/7 Power'],
    isApproved: true,
  },
  {
    title: 'Cozy 2-Bedroom Flat in Ikeja',
    description: 'Well-maintained apartment in a quiet neighborhood. Perfect for young professionals or small families. Close to schools, markets, and transportation hubs.',
    location: 'Lagos',
    price: 1800000,
    apartmentType: 'Apartments / Flats',
    bedrooms: 2,
    bathrooms: 1,
    totalArea: 120,
    amenities: ['Parking', 'Security'],
    isApproved: true,
  },
  {
    title: 'Spacious 4-Bedroom Detached House',
    description: 'Elegant family home with large compound and garden. Features include master bedroom with ensuite, modern kitchen, dining area, and living room. Perfect for large families.',
    location: 'Abuja',
    price: 8500000,
    apartmentType: 'Detached Houses',
    bedrooms: 4,
    bathrooms: 3,
    totalArea: 350,
    amenities: ['Garden', 'Parking', 'Security', 'Generator'],
    isApproved: true,
  },
  {
    title: 'Modern Studio Apartment in Lekki',
    description: 'Fully furnished studio apartment ideal for single professionals. Includes all modern amenities and is located in a secure estate with 24/7 security.',
    location: 'Lagos',
    price: 1200000,
    apartmentType: 'Self-contained rooms',
    bedrooms: 0,
    bathrooms: 1,
    totalArea: 45,
    amenities: ['Furnished', 'Security', 'Parking'],
    isApproved: true,
  },
  {
    title: 'Elegant 3-Bedroom Duplex in Port Harcourt',
    description: 'Beautiful duplex with modern finishes. Features include spacious rooms, modern kitchen, and a rooftop terrace. Located in a prime area with excellent infrastructure.',
    location: 'Port Harcourt',
    price: 5500000,
    apartmentType: 'Duplexes',
    bedrooms: 3,
    bathrooms: 3,
    totalArea: 280,
    amenities: ['Rooftop Terrace', 'Parking', 'Security', 'Generator'],
    isApproved: true,
  },
  {
    title: 'Comfortable 2-Bedroom Bungalow',
    description: 'Charming bungalow in a peaceful neighborhood. Perfect for retirees or small families. Features include large compound, well-maintained garden, and ample parking space.',
    location: 'Ibadan',
    price: 3200000,
    apartmentType: 'Bungalows',
    bedrooms: 2,
    bathrooms: 2,
    totalArea: 200,
    amenities: ['Garden', 'Parking', 'Security'],
    isApproved: true,
  },
  {
    title: 'Shared 3-Bedroom Apartment - Room Available',
    description: 'Spacious shared apartment with one room available. Common areas include fully equipped kitchen, living room, and shared bathroom. Perfect for students or young professionals.',
    location: 'Lagos',
    price: 350000,
    apartmentType: 'Shared Apartments',
    bedrooms: 1,
    bathrooms: 1,
    totalArea: 150,
    amenities: ['Furnished', 'WiFi', 'Security'],
    isApproved: true,
  },
  {
    title: 'Premium Serviced Apartment in Abuja',
    description: 'Luxury serviced apartment with hotel-like amenities. Includes housekeeping, concierge service, and access to business center. Perfect for business travelers or short-term stays.',
    location: 'Abuja',
    price: 2800000,
    apartmentType: 'Serviced Apartments',
    bedrooms: 2,
    bathrooms: 2,
    totalArea: 140,
    amenities: ['Housekeeping', 'Concierge', 'Business Center', 'Gym', 'Pool'],
    isApproved: true,
  },
  {
    title: 'Modern Semi-Detached House in Enugu',
    description: 'Well-designed semi-detached house with contemporary finishes. Features include open-plan living, modern kitchen, and private garden. Located in a family-friendly estate.',
    location: 'Enugu',
    price: 4200000,
    apartmentType: 'Semi-detached Houses',
    bedrooms: 3,
    bathrooms: 2,
    totalArea: 220,
    amenities: ['Garden', 'Parking', 'Security', 'Generator'],
    isApproved: true,
  },
  {
    title: 'Affordable 1-Bedroom Flat in Surulere',
    description: 'Compact and affordable apartment in a convenient location. Close to markets, schools, and public transportation. Perfect for first-time renters or students.',
    location: 'Lagos',
    price: 950000,
    apartmentType: 'Apartments / Flats',
    bedrooms: 1,
    bathrooms: 1,
    totalArea: 65,
    amenities: ['Security'],
    isApproved: true,
  },
];

async function seedProperties() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a user to use as owner (or create a test user)
    let owner = await User.findOne();
    
    if (!owner) {
      console.log('⚠️  No users found. Please create a user first or the script will fail.');
      console.log('   Properties will be created without owner reference.');
    }

    // Clear existing test properties (optional - comment out if you want to keep existing)
    // await Property.deleteMany({ isApproved: true });
    // console.log('✅ Cleared existing properties');

    // Add properties
    const properties = [];
    for (const propData of testProperties) {
      const property = await Property.create({
        ...propData,
        owner: owner ? owner._id : new mongoose.Types.ObjectId(), // Use found user or create dummy ID
      });
      properties.push(property);
      console.log(`✅ Created: ${property.title}`);
    }

    console.log(`\n✅ Successfully seeded ${properties.length} properties!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total properties: ${properties.length}`);
    console.log(`   - All properties are approved and ready to display`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding properties:', error);
    process.exit(1);
  }
}

// Run the seed function
seedProperties();
