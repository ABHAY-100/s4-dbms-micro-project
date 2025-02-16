const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new chamber
exports.createChamber = async (req, res) => {
  try {
    const { number, temperature, capacity } = req.body;
    const chamber = await prisma.chamber.create({
      data: {
        number,
        temperature,
        capacity,
        currentOccupancy: 0,
      },
    });
    res.status(201).json(chamber);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all chambers
exports.getAllChambers = async (req, res) => {
  try {
    const chambers = await prisma.chamber.findMany({
      include: {
        deceased: true,
        maintenance: {
          where: {
            status: {
              in: ['SCHEDULED', 'IN_PROGRESS']
            }
          }
        }
      }
    });
    res.json(chambers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single chamber
exports.getChamber = async (req, res) => {
  try {
    const chamber = await prisma.chamber.findUnique({
      where: { id: req.params.id },
      include: {
        deceased: true,
        maintenance: true,
      },
    });
    if (!chamber) {
      return res.status(404).json({ error: 'Chamber not found' });
    }
    res.json(chamber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update chamber details
exports.updateChamber = async (req, res) => {
  try {
    const chamber = await prisma.chamber.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(chamber);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a chamber
exports.deleteChamber = async (req, res) => {
  try {
    await prisma.chamber.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
