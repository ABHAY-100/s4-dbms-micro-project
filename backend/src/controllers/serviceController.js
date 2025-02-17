import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create service
export const createService = async (req, res) => {
  try {
    const { name, description, type, cost, deceasedId } = req.body;

    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: deceasedId }
    });

    if (!deceased) {
      return res.status(404).json({ error: 'Deceased record not found' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        type,
        cost,
        deceasedId
      }
    });

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get services by deceased ID
export const getServicesByDeceasedId = async (req, res) => {
  try {
    const { deceasedId } = req.params;

    const services = await prisma.service.findMany({
      where: { deceasedId }
    });

    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update service status
export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      }
    });

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update service details
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, type, cost } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        description,
        type,
        cost
      }
    });

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.service.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get service statistics
export const getServiceStats = async (req, res) => {
  try {
    const stats = await prisma.service.groupBy({
      by: ['type', 'status'],
      _count: {
        _all: true
      },
      _sum: {
        cost: true
      }
    });

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
