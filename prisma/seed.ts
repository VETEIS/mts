import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create predefined traffic offenses
  const offenses = [
    {
      name: 'Speeding',
      description: 'Exceeding the speed limit in designated areas',
      penaltyAmount: 2000,
    },
    {
      name: 'No Helmet',
      description: 'Motorcycle rider not wearing proper helmet',
      penaltyAmount: 1500,
    },
    {
      name: 'Red Light Violation',
      description: 'Running through red traffic light',
      penaltyAmount: 3000,
    },
    {
      name: 'No Seatbelt',
      description: 'Driver or passenger not wearing seatbelt',
      penaltyAmount: 1000,
    },
    {
      name: 'Illegal Parking',
      description: 'Parking in prohibited areas or blocking traffic',
      penaltyAmount: 500,
    },
    {
      name: 'Driving Under Influence (DUI)',
      description: 'Operating vehicle while intoxicated',
      penaltyAmount: 10000,
    },
    {
      name: 'Mobile Phone Use While Driving',
      description: 'Using mobile device while operating vehicle',
      penaltyAmount: 5000,
    },
    {
      name: 'No License Plate',
      description: 'Vehicle without proper license plate display',
      penaltyAmount: 2500,
    },
    {
      name: 'Reckless Driving',
      description: 'Dangerous or careless driving behavior',
      penaltyAmount: 4000,
    },
    {
      name: 'Illegal Overtaking',
      description: 'Overtaking in prohibited zones or unsafe manner',
      penaltyAmount: 1800,
    },
    {
      name: 'No Valid License',
      description: 'Operating vehicle without valid driver\'s license',
      penaltyAmount: 3500,
    },
    {
      name: 'Counterflow',
      description: 'Driving against traffic flow',
      penaltyAmount: 2200,
    },
  ]

  // Create offenses
  for (const offense of offenses) {
    const existingOffense = await prisma.offense.findFirst({
      where: { name: offense.name }
    })
    
    if (!existingOffense) {
      await prisma.offense.create({
        data: offense
      })
    }
  }

  // Create admin user (you can modify this with your actual admin email)
  await prisma.user.upsert({
    where: { email: 'admin@mts.gov.ph' },
    update: {},
    create: {
      email: 'admin@mts.gov.ph',
      name: 'MTS Administrator',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Database seeded successfully!')
  console.log(`📊 Created ${offenses.length} traffic offenses`)
  console.log('👤 Created admin user: admin@mts.gov.ph')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
