/**
 * Comprehensive Seed Script
 * Populates database with realistic test data for all modules
 */

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker').default || require('@faker-js/faker');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Import models
const User = require('../src/models/User');
const Property = require('../src/models/Property');
const RoommateProfile = require('../src/models/RoommateProfile');
const Conversation = require('../src/models/Conversation');
const Message = require('../src/models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/roompal';

// Nigerian locations for realistic data
const NIGERIAN_LOCATIONS = [
  'Lagos, Lagos State',
  'Abuja, FCT',
  'Port Harcourt, Rivers State',
  'Ibadan, Oyo State',
  'Kano, Kano State',
  'Enugu, Enugu State',
  'Abeokuta, Ogun State',
  'Kaduna, Kaduna State',
  'Benin City, Edo State',
  'Ilorin, Kwara State',
  'Victoria Island, Lagos',
  'Ikeja, Lagos',
  'Lekki, Lagos',
  'Surulere, Lagos',
  'Yaba, Lagos',
  'Gbagada, Lagos',
  'Wuse 2, Abuja',
  'Maitama, Abuja',
];

const APARTMENT_TYPES = [
  'Apartments / Flats',
  'Self-contained rooms',
  'Shared Apartments',
  'Detached Houses',
  'Semi-detached Houses',
  'Duplexes',
  'Bungalows',
  'Serviced Apartments',
];

const OCCUPATIONS = [
  'Software Engineer',
  'Banker',
  'Doctor',
  'Teacher',
  'Lawyer',
  'Accountant',
  'Business Analyst',
  'Marketing Manager',
  'Graphic Designer',
  'Nurse',
  'Engineer',
  'Architect',
  'Student',
  'Entrepreneur',
  'Consultant',
];

/**
 * Create test users
 */
const createUsers = async (count = 20) => {
  console.log(`\n👥 Creating ${count} test users...`);
  const users = [];

  for (let i = 0; i < count; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    // Don't hash password - let User model's pre-save hook handle it
    const user = await User.create({
      fullName: `${firstName} ${lastName}`,
      email,
      password: 'password123', // Will be hashed by pre-save hook
      isEmailVerified: true,
      isActive: true,
      role: i === 0 ? 'admin' : 'user', // First user is admin
    });

    users.push(user);
    console.log(`  ✅ Created user: ${user.fullName} (${user.email})`);
  }

  return users;
};

/**
 * Create properties
 */
const createProperties = async (users, count = 30) => {
  console.log(`\n🏠 Creating ${count} properties...`);
  const properties = [];

  for (let i = 0; i < count; i++) {
    const owner = faker.helpers.arrayElement(users);
    const location = faker.helpers.arrayElement(NIGERIAN_LOCATIONS);
    const apartmentType = faker.helpers.arrayElement(APARTMENT_TYPES);
    const price = faker.number.int({ min: 500000, max: 10000000 });
    const bedrooms = faker.number.int({ min: 0, max: 5 });
    const bathrooms = faker.number.int({ min: 1, max: 4 });

    const property = await Property.create({
      owner: owner._id,
      title: faker.lorem.sentence({ min: 5, max: 10 }),
      description: faker.lorem.paragraphs({ min: 2, max: 4 }),
      location,
      price,
      apartmentType,
      bedrooms,
      bathrooms,
      images: [
        `https://images.unsplash.com/photo-${faker.number.int({ min: 1500000000000, max: 1600000000000 })}?w=800`,
        `https://images.unsplash.com/photo-${faker.number.int({ min: 1500000000000, max: 1600000000000 })}?w=800`,
      ],
      isApproved: faker.datatype.boolean({ probability: 0.8 }), // 80% approved
      isFlagged: false,
    });

    properties.push(property);
    console.log(`  ✅ Created property: ${property.title} - ₦${property.price.toLocaleString('en-NG')}`);
  }

  return properties;
};

/**
 * Create roommate profiles
 */
const createRoommateProfiles = async (users, count = 15) => {
  console.log(`\n👫 Creating ${count} roommate profiles...`);
  const profiles = [];

  // Select users for roommate profiles
  const selectedUsers = faker.helpers.arrayElements(users, count);

  for (const user of selectedUsers) {
    const profile = await RoommateProfile.create({
      user: user._id,
      gender: faker.helpers.arrayElement(['Male', 'Female', 'Other', 'Prefer not to say']),
      preferredGender: faker.helpers.arrayElement(['Male', 'Female', 'Other', 'No Preference']),
      budget: faker.number.int({ min: 200000, max: 5000000 }),
      preferredLocation: faker.helpers.arrayElement(NIGERIAN_LOCATIONS),
      lifestyle: faker.helpers.arrayElement(['Quiet', 'Moderate', 'Social', 'Party', 'Flexible']),
      cleanlinessLevel: faker.number.int({ min: 1, max: 5 }),
      smoking: faker.datatype.boolean({ probability: 0.2 }),
      pets: faker.datatype.boolean({ probability: 0.3 }),
      occupation: faker.helpers.arrayElement(OCCUPATIONS),
      bio: faker.lorem.paragraph(),
      isActive: true,
    });

    profiles.push(profile);
    console.log(`  ✅ Created profile for: ${user.fullName}`);
  }

  return profiles;
};

/**
 * Create conversations and messages
 */
const createConversationsAndMessages = async (users, count = 25) => {
  console.log(`\n💬 Creating ${count} conversations with messages...`);
  const conversations = [];
  const messages = [];

  for (let i = 0; i < count; i++) {
    // Get two different users
    const [user1, user2] = faker.helpers.arrayElements(users, 2);

    // Create or get conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [user1._id, user2._id] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [user1._id, user2._id],
      });
    }

    conversations.push(conversation);

    // Create 5-15 messages per conversation
    const messageCount = faker.number.int({ min: 5, max: 15 });
    let lastMessage = null;

    for (let j = 0; j < messageCount; j++) {
      const sender = j % 2 === 0 ? user1 : user2;
      const receiver = sender._id.toString() === user1._id.toString() ? user2 : user1;
      const isRead = j < messageCount - 1 || faker.datatype.boolean({ probability: 0.7 });

      const message = await Message.create({
        sender: sender._id,
        receiver: receiver._id,
        conversation: conversation._id,
        content: faker.lorem.sentence({ min: 5, max: 30 }),
        isRead,
        readAt: isRead ? faker.date.recent({ days: 1 }) : null,
      });

      messages.push(message);
      lastMessage = message;
    }

    // Update conversation with last message
    conversation.lastMessage = lastMessage._id;
    conversation.lastMessageAt = lastMessage.createdAt;
    await conversation.save();

    console.log(`  ✅ Created conversation between ${user1.fullName} and ${user2.fullName} (${messageCount} messages)`);
  }

  return { conversations, messages };
};

/**
 * Main seed function
 */
const seedAllData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing data...');
    // Delete all test users (those created by seed script)
    await User.deleteMany({});
    await Property.deleteMany({});
    await RoommateProfile.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
    console.log('✅ Cleared existing test data\n');

    // Create users
    const users = await createUsers(20);

    // Create properties
    const properties = await createProperties(users, 30);

    // Create roommate profiles
    const profiles = await createRoommateProfiles(users, 15);

    // Create conversations and messages
    const { conversations, messages } = await createConversationsAndMessages(users, 25);

    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Users: ${users.length}`);
    console.log(`   ✅ Properties: ${properties.length}`);
    console.log(`   ✅ Roommate Profiles: ${profiles.length}`);
    console.log(`   ✅ Conversations: ${conversations.length}`);
    console.log(`   ✅ Messages: ${messages.length}`);

    console.log('\n🔑 Test Credentials:');
    console.log(`   Admin: ${users[0].email} / password123`);
    console.log(`   User: ${users[1].email} / password123`);
    console.log(`   (All users use password: password123)`);

    console.log('\n✅ Database seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

// Run seed function
seedAllData();
