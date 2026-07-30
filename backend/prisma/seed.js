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

  // Elimina únicamente los registros demo conocidos para que ejecutar el seed
  // varias veces no duplique datos ni afecte lanzamientos creados por el usuario.
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
      description: 'Edición local de Samba OG con campaña enfocada en cultura urbana de Bogotá.',
      market: 'Colombia',
      launchDate: addDays(today, 21),
      status: LaunchStatus.DRAFT,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Moodboard de campaña',
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
      description: 'Lanzamiento regional de Ultraboost 5 con activaciones para corredores urbanos.',
      market: 'LATAM',
      launchDate: addDays(today, 35),
      status: LaunchStatus.IN_REVIEW,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Key visual regional',
            type: 'IMAGE',
            url: 'https://assets.example.com/ultraboost-5/key-visual.jpg',
          },
          {
            name: 'Plan de medios',
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
          comment: 'Materiales listos para validación regional.',
          createdAt: twoDaysAgo,
        },
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[2],
      description: 'Campaña de velocidad para Adizero Adios Pro 4 en el mercado colombiano.',
      market: 'Colombia',
      launchDate: addDays(today, 49),
      status: LaunchStatus.APPROVED,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Video hero',
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
            comment: 'Envío inicial a aprobación.',
            createdAt: twoDaysAgo,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.APPROVED,
            changedById: approver.id,
            comment: 'Campaña aprobada para producción.',
            createdAt: oneDayAgo,
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[3],
      description: 'Relanzamiento de silos clásicos de fútbol con narrativa de archivo.',
      market: 'México',
      launchDate: addDays(today, -14),
      status: LaunchStatus.PUBLISHED,
      creatorId: creator.id,
      assets: {
        create: [
          {
            name: 'Lookbook final',
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
            comment: 'Solicitud de aprobación editorial.',
            createdAt: addDays(today, -20),
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.APPROVED,
            changedById: approver.id,
            comment: 'Contenido y fechas aprobados.',
            createdAt: addDays(today, -18),
          },
          {
            previousStatus: LaunchStatus.APPROVED,
            newStatus: LaunchStatus.PUBLISHED,
            changedById: approver.id,
            comment: 'Publicado según el calendario comercial.',
            createdAt: addDays(today, -14),
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[4],
      description: 'Actualización de campaña outdoor pendiente de ajustes en el key visual.',
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
            comment: 'Primera propuesta lista para revisión.',
            createdAt: twoDaysAgo,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.CHANGES_REQUESTED,
            changedById: approver.id,
            comment: 'Ajustar contraste del producto y claim regional.',
            createdAt: oneDayAgo,
          },
        ],
      },
    },
  });

  await prisma.launch.create({
    data: {
      name: SEED_LAUNCH_NAMES[5],
      description: 'Propuesta de colaboración evaluada para el calendario Originals.',
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
            comment: 'Propuesta enviada al comité global.',
            createdAt: twoDaysAgo,
          },
          {
            previousStatus: LaunchStatus.IN_REVIEW,
            newStatus: LaunchStatus.REJECTED,
            changedById: approver.id,
            comment: 'La propuesta no se alinea con el calendario comercial actual.',
            createdAt: oneDayAgo,
          },
        ],
      },
    },
  });

  console.log('Seed completado: 2 usuarios y 6 lanzamientos de ejemplo.');
}

main()
  .catch((error) => {
    console.error('No fue posible completar el seed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
