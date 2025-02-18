import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNextOfKin = async (req, res) => {
  try {
    const { firstName, lastName, relationship, phoneNumber, email, address } = req.body;
    const deceasedId = req.query.deceased_id;

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
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        relationship: true,
        phoneNumber: true,
        email: true,
        address: true,
        deceased: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    });

    res.status(201).json({ message: 'Next of kin created successfully', nextOfKin});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNextOfKinByDeceasedId = async (req, res) => {
  try {
    const { deceased_id } = req.query;

    const nextOfKin = await prisma.nextOfKin.findMany({
      where: { deceasedId: deceased_id }
    });

    res.status(200).json(nextOfKin);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNextOfKin = async (req, res) => {
  try {
    const { kin_id } = req.query;
    const { firstName, lastName, relationship, phoneNumber, email, address } = req.body;

    const nextOfKin = await prisma.nextOfKin.update({
      where: { id: kin_id },
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

export const deleteNextOfKin = async (req, res) => {
  try {
    const { kin_id } = req.query;

    await prisma.nextOfKin.delete({
      where: { id: kin_id }
    });

    res.status(200).send({ message: 'Next of kin deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
