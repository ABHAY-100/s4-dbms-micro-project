const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new deceased record
exports.createDeceased = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      dateOfDeath,
      timeOfDeath,
      causeOfDeath,
      gender,
      identificationMarks,
      personalBelongings,
      chamberId,
    } = req.body;

    const deceased = await prisma.deceasedRecord.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        dateOfDeath: new Date(dateOfDeath),
        timeOfDeath,
        causeOfDeath,
        gender,
        identificationMarks,
        personalBelongings,
        chamberId,
        userId: req.user.id, // From auth middleware
      },
      include: {
        chamber: true,
        nextOfKin: true,
      },
    });

    res.status(201).json(deceased);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all deceased records
exports.getAllDeceased = async (req, res) => {
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

// Get a single deceased record
exports.getDeceased = async (req, res) => {
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

// Update a deceased record
exports.updateDeceased = async (req, res) => {
  try {
    const deceased = await prisma.deceasedRecord.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        chamber: true,
        nextOfKin: true,
      },
    });
    res.json(deceased);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a deceased record
exports.deleteDeceased = async (req, res) => {
  try {
    await prisma.deceasedRecord.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
