const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const createService = async (req, res) => {
  try {
    const { name, description, type, cost } = req.body;
    const deceasedId = req.query.deceased_id;

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
        cost: parseFloat(cost),
        deceasedId
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        cost: true,
        status: true,
        completedAt: true,
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

    res.status(201).json({ message: 'Service created successfully', service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getServicesByDeceasedId = async (req, res) => {
  try {
    const { deceased_id } = req.query;

    const services = await prisma.service.findMany({
      where: { deceasedId: deceased_id },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        cost: true,
        status: true,
        completedAt: true,
        deceased: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    res.json(services);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateService = async (req, res) => {
  try {
    const { service_id } = req.query;
    const { status, name, description, type, cost } = req.body;

    if (status && !['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({
        error: "Invalid status. Status must be one of: PENDING, IN_PROGRESS, COMPLETED, CANCELLED",
      });
    }

    if (type && !['CARE', 'RITUAL', 'LOGISTICS', 'OTHER'].includes(type)) {
      return res.status(400).json({
        error: "Invalid type. Type must be one of: CARE, RITUAL, LOGISTICS, OTHER",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (type) updateData.type = type;
    if (cost) updateData.cost = parseFloat(cost);

    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    const updatedService = await prisma.service.update({
      where: { id: service_id },
      data: updateData,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        cost: true,
        status: true,
        completedAt: true,
        deceased: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

    res.json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteService = async (req, res) => {
  try {
    const { service_id } = req.query;

    await prisma.service.delete({
      where: { id: service_id }
    });

    res.status(200).send({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getServiceStats = async (req, res) => {
  try {
    const stats = await prisma.service.groupBy({
      by: ['status', 'type'],
      _count: {
        _all: true,
      },
      _sum: {
        cost: true,
      },
    });

    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createService,
  getServicesByDeceasedId,
  updateService,
  deleteService,
  getServiceStats
};
