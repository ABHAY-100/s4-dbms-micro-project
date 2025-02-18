import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createDeceasedRecord = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      dateOfDeath,
      timeOfDeath,
      causeOfDeath,
      gender,
      chamberId,
      chamberUnitName
    } = req.body;

    const chamber = await prisma.chamber.findUnique({
      where: { id: chamberId }
    });

    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }

    if (chamber.status === 'MAINTENANCE' || chamber.status === 'OUT_OF_ORDER') {
      return res.status(400).json({ 
        error: `Cannot assign deceased to chamber ${chamber.name}. Chamber is under ${chamber.status.toLowerCase()}`
      });
    }

    if (chamber.currentOccupancy >= chamber.capacity) {
      return res.status(400).json({ 
        error: `Cannot assign deceased to chamber ${chamber.name}. Chamber is at full capacity (${chamber.capacity} units)`
      });
    }

    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.deceasedRecord.create({
        data: {
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          dateOfDeath: new Date(dateOfDeath),
          timeOfDeath,
          causeOfDeath,
          gender,
          chamber: { connect: { id: chamberId } },
          chamberUnitName,
          handledBy: { connect: { id: req.user.id } }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          dateOfDeath: true,
          timeOfDeath: true,
          causeOfDeath: true,
          gender: true,
          status: true,
          chamberUnitName: true,
          chamber: {
            select: {
              id: true,
              name: true,
              status: true,
              capacity: true,
              currentOccupancy: true
            }
          }
        }
      });

      await tx.chamber.update({
        where: { id: chamberId },
        data: {
          currentOccupancy: { increment: 1 },
          status: chamber.currentOccupancy + 1 >= chamber.capacity ? 'OCCUPIED' : 'AVAILABLE'
        }
      });

      return newRecord;
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllDeceasedRecords = async (req, res) => {
  try {
    const records = await prisma.deceasedRecord.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        dateOfDeath: true,
        timeOfDeath: true,
        causeOfDeath: true,
        gender: true,
        status: true,
        chamberUnitName: true,
        chamber: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDeceasedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.deceasedRecord.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        dateOfDeath: true,
        timeOfDeath: true,
        causeOfDeath: true,
        gender: true,
        status: true,
        chamberUnitName: true,
        chamber: {
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            currentOccupancy: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Deceased record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDeceasedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.dateOfDeath) {
      updateData.dateOfDeath = new Date(updateData.dateOfDeath);
    }

    if (updateData.chamberId) {
      const newChamber = await prisma.chamber.findUnique({
        where: { id: updateData.chamberId }
      });

      if (!newChamber) {
        return res.status(404).json({ error: 'New chamber not found' });
      }

      if (newChamber.status === 'MAINTENANCE' || newChamber.status === 'OUT_OF_ORDER') {
        return res.status(400).json({ 
          error: `Cannot assign deceased to chamber ${newChamber.name}. Chamber is under ${newChamber.status.toLowerCase()}`
        });
      }

      if (newChamber.currentOccupancy >= newChamber.capacity) {
        return res.status(400).json({ 
          error: `Cannot assign deceased to chamber ${newChamber.name}. Chamber is at full capacity (${newChamber.capacity} units)`
        });
      }
    }

    const record = await prisma.deceasedRecord.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        dateOfDeath: true,
        timeOfDeath: true,
        causeOfDeath: true,
        gender: true,
        status: true,
        chamberUnitName: true,
        chamber: {
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            currentOccupancy: true
          }
        }
      }
    });

    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteDeceasedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.$transaction(async (tx) => {
      const record = await tx.deceasedRecord.findUnique({
        where: { id },
        include: { chamber: true }
      });

      if (record?.chamber) {
        await tx.chamber.update({
          where: { id: record.chamber.id },
          data: {
            currentOccupancy: { decrement: 1 },
            status: 'AVAILABLE'
          }
        });
      }

      await tx.deceasedRecord.delete({ where: { id } });
    });

    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
