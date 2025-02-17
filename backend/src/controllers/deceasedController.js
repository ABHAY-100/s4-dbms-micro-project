import { PrismaClient } from '@prisma/client';
import { findAvailableChamber, findAvailableUnit } from '../utils/chamberUtils.js';

const prisma = new PrismaClient();

export const createDeceasedRecord = async (req, res) => {
  try {
    const recordData = { ...req.body };
    
    // Find available chamber and unit
    const chamber = await findAvailableChamber();
    const { unitNumber, unitName } = await findAvailableUnit(chamber.id);

    // Create record with chamber assignment
    const record = await prisma.$transaction(async (tx) => {
      const newRecord = await tx.deceasedRecord.create({
        data: {
          ...recordData,
          chamberId: chamber.id,
          chamberUnitName: unitName,
          status: 'IN_FACILITY',
          handledBy: {
            connect: { id: req.user.id }
          }
        }
      });

      await tx.chamber.update({
        where: { id: chamber.id },
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
    const deceased = await prisma.deceasedRecord.findMany({
      include: {
        chamber: true,
        nextOfKin: true,
        services: true,
      },
    });
    res.json(deceased);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDeceasedRecord = async (req, res) => {
  try {
    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: req.params.id },
      include: {
        chamber: true,
        nextOfKin: true,
        services: true,
        releaseInfo: true,
      },
    });
    if (!deceased) {
      return res.status(404).json({ error: 'Deceased record not found' });
    }
    res.json(deceased);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDeceasedRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const currentRecord = await prisma.deceasedRecord.findUnique({
      where: { id },
      select: { status: true, chamberId: true }
    });

    if (!currentRecord) {
      return res.status(404).json({ error: 'Record not found' });
    }

    // Handle automatic release
    if (['RELEASED', 'PROCESSED'].includes(updateData.status) && currentRecord.chamberId) {
      const record = await prisma.$transaction(async (tx) => {
        const updatedRecord = await tx.deceasedRecord.update({
          where: { id },
          data: {
            ...updateData,
            chamberId: null,
            chamberUnitName: null
          }
        });

        await tx.chamber.update({
          where: { id: currentRecord.chamberId },
          data: {
            currentOccupancy: { decrement: 1 },
            status: 'AVAILABLE'
          }
        });

        return updatedRecord;
      });

      return res.json(record);
    }

    // Normal update without chamber changes
    const record = await prisma.deceasedRecord.update({
      where: { id },
      data: updateData
    });

    res.json(record);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteDeceasedRecord = async (req, res) => {
  try {
    await prisma.deceasedRecord.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
