import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findAvailableChamber = async () => {
  const chambers = await prisma.chamber.findMany({
    where: {
      status: 'AVAILABLE',
    },
    orderBy: {
      name: 'asc',
    },
  });

  for (const chamber of chambers) {
    if (chamber.currentOccupancy < chamber.capacity) {
      return chamber;
    }
  }
  throw new Error('No available chambers');
};

export const findAvailableUnit = async (chamberId) => {
  const chamber = await prisma.chamber.findUnique({
    where: { id: chamberId },
    include: {
      deceased: {
        where: {
          status: 'IN_FACILITY',
        },
        select: { chamberUnitName: true },
      },
    },
  });

  if (!chamber) {
    throw new Error('Chamber not found');
  }

  const occupiedUnits = chamber.deceased.map(d => d.chamberUnitName).filter(Boolean);
  
  for (let i = 1; i <= chamber.capacity; i++) {
    const unitName = `${i}${chamber.name}`;
    if (!occupiedUnits.includes(unitName)) {
      return { unitNumber: i, unitName };
    }
  }
  
  throw new Error('No available units');
};
