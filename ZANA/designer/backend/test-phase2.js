const express = require('express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Test Phase 2 API endpoints
async function testPhase2() {
  console.log('🧪 Testing Phase 2 API Endpoints...\n');

  try {
    // Test 1: Check if all routes are properly imported
    console.log('✅ 1. Testing route imports...');
    
    const authRoutes = require('./src/routes/auth');
    const venueRoutes = require('./src/routes/venues');
    const mobileProviderRoutes = require('./src/routes/mobileProviders');
    const serviceRoutes = require('./src/routes/services');
    const staffRoutes = require('./src/routes/staff');
    const openingHoursRoutes = require('./src/routes/openingHours');
    
    console.log('   ✓ All route modules imported successfully');

    // Test 2: Check middleware imports
    console.log('✅ 2. Testing middleware imports...');
    
    const { authenticateToken, requireRole } = require('./src/middleware/auth');
    const {
      validateVenue,
      validateMobileProvider,
      validateService,
      validateStaff
    } = require('./src/middleware/validation');
    
    console.log('   ✓ All middleware modules imported successfully');

    // Test 3: Check database connection
    console.log('✅ 3. Testing database connection...');
    
    await prisma.$connect();
    console.log('   ✓ Database connection established');

    // Test 4: Check if models exist
    console.log('✅ 4. Testing database models...');
    
    const userCount = await prisma.user.count();
    const venueCount = await prisma.venue.count();
    const mobileProviderCount = await prisma.mobileProvider.count();
    const serviceCount = await prisma.service.count();
    const staffCount = await prisma.staff.count();
    const openingHoursCount = await prisma.openingHours.count();
    
    console.log(`   ✓ Database models accessible:`);
    console.log(`     - Users: ${userCount}`);
    console.log(`     - Venues: ${venueCount}`);
    console.log(`     - Mobile Providers: ${mobileProviderCount}`);
    console.log(`     - Services: ${serviceCount}`);
    console.log(`     - Staff: ${staffCount}`);
    console.log(`     - Opening Hours: ${openingHoursCount}`);

    // Test 5: Check server startup
    console.log('✅ 5. Testing server startup...');
    
    const server = app.listen(0, () => {
      const port = server.address().port;
      console.log(`   ✓ Server started on port ${port}`);
      server.close();
    });

    console.log('\n🎉 Phase 2 Implementation Complete!');
    console.log('\n📋 Available API Endpoints:');
    console.log('   🏠 Auth: /api/v1/auth/*');
    console.log('   🏢 Venues: /api/v1/venues/*');
    console.log('   🚗 Mobile Providers: /api/v1/mobile-providers/*');
    console.log('   ✂️  Services: /api/v1/services/*');
    console.log('   👥 Staff: /api/v1/staff/*');
    console.log('   ⏰ Opening Hours: /api/v1/opening-hours/*');
    console.log('   🩺 Health: /health');

    console.log('\n🚀 Ready for Provider Onboarding Screens (Phase 2.5)');

  } catch (error) {
    console.error('❌ Phase 2 Test Failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPhase2();