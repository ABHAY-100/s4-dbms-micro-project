import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createChamber = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    
    if (!/^[A-Z]$/.test(name)) {
      return res.status(400).json({ error: "Chamber name must be a single uppercase letter (A-Z)" });
    }

    if (!Number.isInteger(capacity) || capacity <= 0) {
      return res.status(400).json({ error: "Capacity must be a positive integer" });
    }

    const existingChamber = await prisma.chamber.findUnique({
      where: { name }
    });

    if (existingChamber) {
      return res.status(400).json({ error: `Chamber with name ${name} already exists` });
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
        capacity: true,
        currentOccupancy: true,
        status: true
      }
    });
    res.status(201).json(chamber);
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
      res.status(400).json({ error: `Chamber with this name already exists` });
    } else {
      res.status(400).json({ error: error.message });
    }
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
          select: {
            id: true,
            firstName: true,
            lastName: true,
            chamberUnitName: true,
            status: true
          }
        }
      }
    });
    res.json(chambers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getChamber = async (req, res) => {
  try {
    const { id } = req.params;
    const chamber = await prisma.chamber.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        status: true,
        capacity: true,
        currentOccupancy: true,
        deceased: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            chamberUnitName: true,
            status: true
          }
        }
      }
    });

    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }

    res.json(chamber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChamber = async (req, res) => {
  try {
    const name = req.query.chamber_name;
    const { status, capacity } = req.body;

    const chamber = await prisma.chamber.findUnique({
      where: { name },
      include: { deceased: true }
    });

    if (!chamber) {
      return res.status(404).json({ error: `Chamber ${name} not found` });
    }

    if (capacity && capacity < chamber.currentOccupancy) {
      return res.status(400).json({ 
        error: `Cannot reduce capacity below current occupancy (${chamber.currentOccupancy} units in use)`
      });
    }

    if (status && (status === 'MAINTENANCE' || status === 'OUT_OF_ORDER') && chamber.deceased.length > 0) {
      return res.status(400).json({ 
        error: `Cannot set chamber to ${status.toLowerCase()} while it has deceased records assigned`
      });
    }

    const updatedChamber = await prisma.chamber.update({
      where: { name },
      data: { 
        status: status || undefined,
        capacity: capacity || undefined
      },
      select: {
        id: true,
        name: true,
        status: true,
        capacity: true,
        currentOccupancy: true
      }
    });

    res.json(updatedChamber);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteChamber = async (req, res) => {
  try {
    const name = req.query.chamber_name;
    const chamber = await prisma.chamber.findUnique({
      where: { name },
      include: { deceased: true }
    });

    if (!chamber) {
      return res.status(404).json({ error: `Chamber ${name} not found` });
    }

    if (chamber.deceased.length > 0) {
      return res.status(400).json({ error: 'Cannot delete chamber with assigned deceased records' });
    }

    await prisma.chamber.delete({ where: { name } });
    res.json({ message: `Chamber ${name} deleted successfully` });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
