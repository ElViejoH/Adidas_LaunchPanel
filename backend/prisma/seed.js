import bcrypt from 'bcryptjs';
import { LaunchStatus, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const SEED_LAUNCH_NAMES = [
  'Samba OG Bogotá Edition',
  'Ultraboost 5 LATAM',
  'Adizero Adios Pro 4 Colombia',
  'Predator Archive Pack',
  'Terrex Trail Refresh',
  'Forum Low Creator Drop',
];

const addDays = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
};

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const creator = await prisma.user.upsert({
    where: { email: 'creator@adidas.com' },
    update: {
      name: 'Camila Creator',
      password,
      role: Role.CREATOR,
    },
    create: {
      name: 'Camila Creator',
      email: 'creator@adidas.com',
      password,
      role: Role.CREATOR,
    },
  });

  const approver = await prisma.user.upsert({
    where: { email: 'approver@adidas.com' },
    update: {
      name: 'Andrés Approver',
      password,
      role: Role.APPROVER,
    },
    create: {
      name: 'Andrés Approver',
      email: 'approver@adidas.com',
      password,
      role: Role.APPROVER,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@adidas.com' },
    update: {
      name: 'Alex Admin',
      password,
      role: Role.ADMIN,
    },
    create: {
      name: 'Alex Admin',
      email: 'admin@adidas.com',
      password,
      role: Role.ADMIN,
    },
  });

  // Delete only known demo records so repeated seed runs do not duplicate data
  // or affect launches created by the user.
  await prisma.launch.deleteMany({
    where: {
      creatorId: creator.id,
      name: { in: SEED_LAUNCH_NAMES },
    },
  });

  const today = new Date();
  const twoDaysAgo = addDays(today, -2);
  const oneDayAgo = addDays(today, -1);

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[0],
      description: 'Local Samba OG edition with a campaign focused on Bogota urban culture.',
      market: 'Colombia',
      launchDate: addDays(today, 21),
      status: LaunchStatus.DRAFT,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Campaign moodboard',
            type: 'IMAGE',
            url: 'https://assets.example.com/samba-bogota/moodboard.jpg',
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[1],
      description: 'Regional Ultraboost 5 launch with activations for urban runners.',
      market: 'LATAM',
      launchDate: addDays(today, 35),
      status: LaunchStatus.IN_REVIEW,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Regional key visual',
            type: 'IMAGE',
            url: 'https://assets.example.com/ultraboost-5/key-visual.jpg',
          },
          {
            name: 'Media plan',
            type: 'DOCUMENT',
            url: 'https://assets.example.com/ultraboost-5/media-plan.pdf',
          },
        ],
      },
      statusHistory: {
        create: {
          previousStatus: LaunchStatus.DRAFT,
          newStatus: LaunchStatus.IN_REVIEW,
          changedById: creator.id,
          comment: 'Materials are ready for regional review.',
          createdAt: twoDaysAgo,
        },
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[2],
      description: 'Speed campaign for Adizero Adios Pro 4 in the Colombian market.',
      market: 'Colombia',
      launchDate: addDays(today, 49),
      status: LaunchStatus.APPROVED,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Hero video',
            type: 'VIDEO',
            url: 'https://assets.example.com/adizero-pro-4/hero-video.mp4',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            previousStatus: LaunchStatus.DRAFT,
            newStatus: LaunchStatus.IN_REVIEW,
            changedById: creator.id,
            comment: 'Initial submission for approval.',
            createdAt: twoDaysAgo,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.APPROVED,
            changedById: approver.id,
            comment: 'Campaign approved for production.',
            createdAt: oneDayAgo,
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[3],
      description: 'Relaunch of classic football silhouettes with an archive-led narrative.',
      market: 'Mexico',
      launchDate: addDays(today, -14),
      status: LaunchStatus.PUBLISHED,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Final lookbook',
            type: 'DOCUMENT',
            url: 'https://assets.example.com/predator-archive/lookbook.pdf',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            previousStatus: LaunchStatus.DRAFT,
            newStatus: LaunchStatus.IN_REVIEW,
            changedById: creator.id,
            comment: 'Editorial approval requested.',
            createdAt: addDays(today, -20),
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.APPROVED,
            changedById: approver.id,
            comment: 'Content and dates approved.',
            createdAt: addDays(today, -18),
          },
          {
            previousStatus: LaunchStatus.APPROVED,
            newStatus: LaunchStatus.PUBLISHED,
            changedById: approver.id,
            comment: 'Published according to the commercial calendar.',
            createdAt: addDays(today, -14),
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[4],
      description: 'Outdoor campaign refresh pending key visual adjustments.',
      market: 'LATAM',
      launchDate: addDays(today, 63),
      status: LaunchStatus.CHANGES_REQUESTED,
      creatorId: creator.id,
      statusHistory: {
        create: [
          {
            previousStatus: LaunchStatus.DRAFT,
            newStatus: LaunchStatus.IN_REVIEW,
            changedById: creator.id,
            comment: 'First proposal ready for review.',
            createdAt: twoDaysAgo,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.CHANGES_REQUESTED,
            changedById: approver.id,
            comment: 'Adjust product contrast and the regional claim.',
            createdAt: oneDayAgo,
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[5],
      description: 'Collaboration proposal evaluated for the Originals calendar.',
      market: 'Global',
      launchDate: addDays(today, 77),
      status: LaunchStatus.REJECTED,
      creatorId: creator.id,
      statusHistory: {
        create: [
          {
            previousStatus: LaunchStatus.DRAFT,
            newStatus: LaunchStatus.IN_REVIEW,
            changedById: creator.id,
            comment: 'Proposal submitted to the global committee.',
            createdAt: twoDaysAgo,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.REJECTED,
            changedById: approver.id,
            comment: 'The proposal does not align with the current commercial calendar.',
            createdAt: oneDayAgo,
          },
        ],
      },
    },
  });

  console.log('Seed completed: 3 users and 6 sample launches.');
}

main()
  .catch((error) => {
    console.error('The seed could not be completed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
