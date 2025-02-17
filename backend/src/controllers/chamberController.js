import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const isValidChamberName = (name) => {
  const pattern = /^[A-Z]$/;
  return pattern.test(name);
};

export const generateUnitName = (unitNumber) => {
  return `${unitNumber}`;
};

export const findAvailableUnit = async (chamberId) => {
  const chamber = await prisma.chamber.findUnique({
    where: { id: chamberId },
    include: {
      deceased: {
        select: { chamberUnitName: true }
      }
    }
  });

  if (!chamber) {
    throw new Error('Chamber not found');
  }

  const occupiedUnits = chamber.deceased.map(d => d.chamberUnitName).filter(n => n !== null);
  
  for (let i = 1; i <= chamber.capacity; i++) {
    if (!occupiedUnits.includes(`${i}${chamber.name}`)) {
      return i;
    }
  }
  
  throw new Error('No available units');
};

export const createChamber = async (req, res) => {
  try {
    const { name, temperature, capacity } = req.body;
    
    if (!isValidChamberName(name)) {
      return res.status(400).json({ 
        error: "Chamber name must be a single uppercase letter (A-Z)" 
      });
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({
        error: "Capacity must be a positive integer"
      });
    }

    const chamber = await prisma.chamber.create({
      data: {
        name,
        capacity,
        currentOccupancy: 0,
      },
      select: {
        id: true,
        name: true,
        status: true,
        capacity: true,
        currentOccupancy: true
      }
    });
    res.status(201).json({ message: `Chamber ${chamber.name} created successfully.`, chamber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; // DONE

export const assignUnit = async (req, res) => {
  try {
    const { deceasedID, chamberID } = req.body;
    
    const chamber = await prisma.chamber.findUnique({
      where: { id: chamberID }
    });
    
    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }

    const unitNumber = await findAvailableUnit(chamberID);
    const unitName = `${unitNumber}${chamber.name}`;

    const updated = await prisma.$transaction([
      prisma.deceasedRecord.update({
        where: { id: deceasedID },
        data: {
          chamberId: chamberID,
          chamberUnitNumber: unitNumber,
          chamberUnitName: unitName,
          status: 'IN_FACILITY'
        }
      }),
      prisma.chamber.update({
        where: { id: chamberID },
        data: {
          currentOccupancy: {
            increment: 1
          }
        }
      })
    ]);

    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const releaseUnit = async (req, res) => {
  try {
    const { deceasedId } = req.body;
    
    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: deceasedId },
      select: { chamberId: true }
    });

    if (!deceased || !deceased.chamberId) {
      return res.status(400).json({ error: 'Record not found or not in a chamber' });
    }

    // Update the deceased record and chamber occupancy
    const updated = await prisma.$transaction([
      prisma.deceasedRecord.update({
        where: { id: deceasedId },
        data: {
          chamberId: null,
          unitNumber: null,
          unitName: null,
          status: 'RELEASED'
        }
      }),
      prisma.chamber.update({
        where: { id: deceased.chamberId },
        data: {
          currentOccupancy: {
            decrement: 1
          }
        }
      })
    ]);

    res.json(updated[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllChambers = async (req, res) => {
  try {
    const chambers = await prisma.chamber.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        capacity: true,
        currentOccupancy: true,
        deceased: {
          where: {
            status: 'IN_FACILITY'
          },
          select: {
            firstName: true,
            lastName: true,
            status: true,
            chamberUnitName: true
          }
        }
      }
    });

    // Add available units information
    const chambersWithUnits = chambers.map(chamber => ({
      ...chamber,
      availableUnits: Array.from({ length: chamber.capacity }, (_, i) => i + 1)
        .filter(num => 
          !chamber.deceased.some(d => 
            d.chamberUnitName && parseInt(d.chamberUnitName.charAt(0)) === num
          )
        )
        .map(num => generateUnitName(num, chamber.name))
    }));

    res.json(chambersWithUnits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}; // DONE

export const getChamber = async (req, res) => {
  try {
    const chamber = await prisma.chamber.findUnique({
      where: { id: req.params.chamber_name },
      include: {
        deceased: {
          where: {
            status: 'IN_FACILITY'
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            unitNumber: true,
            unitName: true
          }
        }
      },
    });
    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }

    const chamberWithUnits = {
      ...chamber,
      availableUnits: Array.from({ length: chamber.capacity }, (_, i) => i + 1)
        .filter(num => !chamber.deceased.some(d => d.unitNumber === num))
        .map(num => generateUnitName(num, chamber.name))
    };

    res.json(chamberWithUnits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};  // DONE

export const updateChamber = async (req, res) => {
  try {
    const { chamber_name } = req.query;
    const { status, capacity } = req.body;
    
    if (!chamber_name) {
      return res.status(400).json({ error: 'Chamber name is required' });
    }

    const existingChamber = await prisma.chamber.findUnique({
      where: { name: chamber_name }
    });

    if (!existingChamber) {
      return res.status(404).json({ error: `Chamber ${chamber_name} not found` });
    }

    const allowedFields = {};

    if (status !== undefined) allowedFields.status = status;
    if (capacity !== undefined) {
      if (!Number.isInteger(capacity) || capacity <= 0) {
        return res.status(400).json({
          error: "Capacity must be a positive integer"
        });
      }
      allowedFields.capacity = capacity;
    }

    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({
        error: "Please provide at least one valid field to update (temperature, status, or capacity)"
      });
    }

    const chamber = await prisma.chamber.update({
      where: { name: chamber_name },
      data: allowedFields,
      select: {
        name: true,
        status: true,
        capacity: true,
        currentOccupancy: true
      }
    });

    res.json(chamber);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; // DONE

export const deleteChamber = async (req, res) => {
  try {
    const { chamber_name } = req.query;
    
    if (!chamber_name) {
      return res.status(400).json({ error: 'Chamber name is required' });
    }

    const existingChamber = await prisma.chamber.findUnique({
      where: { name: chamber_name }
    });

    if (!existingChamber) {
      return res.status(404).json({ error: `Chamber ${chamber_name} not found` });
    }

    await prisma.chamber.delete({
      where: { name: chamber_name }
    });
    
    res.status(200).json({ message: `Chamber ${chamber_name} deleted successfully` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}; // DONE
