import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create next of kin
export const createNextOfKin = async (req, res) => {
  try {
    const { firstName, lastName, relationship, phoneNumber, email, address, deceasedId } = req.body;

    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: deceasedId }
    });

    if (!deceased) {
      return res.status(404).json({ error: 'Deceased record not found' });
    }

    const nextOfKin = await prisma.nextOfKin.create({
      data: {
        firstName,
        lastName,
        relationship,
        phoneNumber,
        email,
        address,
        deceasedId
      }
    });

    res.status(201).json(nextOfKin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get next of kin by deceased ID
export const getNextOfKinByDeceasedId = async (req, res) => {
  try {
    const { deceasedId } = req.params;

    const nextOfKin = await prisma.nextOfKin.findMany({
      where: { deceasedId }
    });

    res.status(200).json(nextOfKin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update next of kin
export const updateNextOfKin = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, relationship, phoneNumber, email, address } = req.body;

    const nextOfKin = await prisma.nextOfKin.update({
      where: { id },
      data: {
        firstName,
        lastName,
        relationship,
        phoneNumber,
        email,
        address
      }
    });

    res.status(200).json(nextOfKin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete next of kin
export const deleteNextOfKin = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.nextOfKin.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
