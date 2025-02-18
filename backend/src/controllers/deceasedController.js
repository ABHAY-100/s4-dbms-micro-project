import { PrismaClient } from "@prisma/client";

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
      chamberUnitName,
      personalBelongings,
      identificationMarks,
    } = req.body;

    const chamber = await prisma.chamber.findUnique({
      where: { id: chamberId },
      include: {
        deceased: true,
      },
    });

    if (!chamber) {
      return res.status(404).json({ error: "Chamber not found" });
    }

    if (chamber.status === "MAINTENANCE" || chamber.status === "OUT_OF_ORDER") {
      return res.status(400).json({
        error: `Cannot assign deceased to chamber ${
          chamber.name
        }. Chamber is under ${chamber.status.toLowerCase()}`,
      });
    }

    const currentOccupancy = chamber.deceased.length;
    if (currentOccupancy >= chamber.capacity) {
      return res.status(400).json({
        error: `Cannot assign deceased to chamber ${chamber.name}. Chamber is at full capacity (${chamber.capacity} units)`,
      });
    }

    let createdRecord;
    try {
      await prisma.$transaction(async (tx) => {
        createdRecord = await tx.deceasedRecord.create({
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
            handledBy: { connect: { id: req.user.id } },
            personalBelongings,
            identificationMarks,
          },
        });

        const updatedChamber = await tx.chamber.findUnique({
          where: { id: chamberId },
          include: { deceased: true },
        });

        const newOccupancy = updatedChamber.deceased.length;
        await tx.chamber.update({
          where: { id: chamberId },
          data: {
            currentOccupancy: newOccupancy,
            status: newOccupancy >= chamber.capacity ? "OCCUPIED" : "AVAILABLE",
          },
        });
      });
    } catch (error) {
      if (
        error.code === "P2002" &&
        error.meta?.target?.includes("chamberUnitName")
      ) {
        return res.status(400).json({
          error: `Chamber unit name '${chamberUnitName}' is already in use. Please choose a different unit name.`,
        });
      }
      console.error("Error creating deceased record:", error);
      return res.status(500).json({
        error:
          "An error occurred while creating the deceased record. Please try again.",
      });
    }

    const finalRecord = await prisma.deceasedRecord.findUnique({
      where: { id: createdRecord.id },
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
        identificationMarks: true,
        personalBelongings: true,
        chamber: {
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            currentOccupancy: true,
          },
        },
      },
    });

    res
      .status(201)
      .json({ message: "Deceased record created successfully", finalRecord });
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
            status: true,
          },
        },
        nextOfKin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationship: true,
            phoneNumber: true,
            email: true,
            address: true,
          },
        },
      },
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDeceasedRecord = async (req, res) => {
  try {
    const record = await prisma.deceasedRecord.findUnique({
      where: { id: req.query.deceased_id },
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
        identificationMarks: true,
        personalBelongings: true,
        chamber: {
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            currentOccupancy: true,
          },
        },
        nextOfKin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            relationship: true,
            phoneNumber: true,
            email: true,
            address: true,
          },
        }
      },
    });

    if (!record) {
      return res.status(404).json({ error: "Deceased record not found" });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateDeceasedRecord = async (req, res) => {
  try {
    const deceased_id = req.query.id;
    const { status } = req.body;

    if (!status || !["IN_FACILITY", "RELEASED", "PROCESSED"].includes(status)) {
      return res.status(400).json({
        error:
          "Invalid status. Status must be one of: IN_FACILITY, RELEASED, PROCESSED",
      });
    }

    const record = await prisma.deceasedRecord.findUnique({
      where: { id: deceased_id },
      include: { chamber: true },
    });

    if (!record) {
      return res.status(404).json({ error: "Deceased record not found" });
    }

    let updatedRecord;
    await prisma.$transaction(async (tx) => {
      // If status is RELEASED or PROCESSED and there's a chamber assigned
      if (["RELEASED", "PROCESSED"].includes(status) && record.chamber) {
        // First update deceased record without chamber info
        updatedRecord = await tx.deceasedRecord.update({
          where: { id: deceased_id },
          data: {
            status,
            chamber: { disconnect: true }, // This will handle both chamberId and chamberUnitName
          },
        });

        // Then update chamber occupancy
        const chamber = await tx.chamber.findUnique({
          where: { id: record.chamber.id },
          include: { deceased: true },
        });

        if (chamber) {
          const newOccupancy = chamber.deceased.length - 1;
          await tx.chamber.update({
            where: { id: chamber.id },
            data: {
              currentOccupancy: newOccupancy,
              status:
                newOccupancy < chamber.capacity ? "AVAILABLE" : "OCCUPIED",
            },
          });
        }
      } else {
        // Just update the status without changing chamber allocation
        updatedRecord = await tx.deceasedRecord.update({
          where: { id: deceased_id },
          data: { status },
        });
      }
    });

    res.json({
      message: "Status updated successfully",
      record: updatedRecord,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteDeceasedRecord = async (req, res) => {
  try {
    await prisma.$transaction(async (tx) => {
      const record = await tx.deceasedRecord.findUnique({
        where: { id: req.query.deceased_id },
        include: { chamber: true },
      });

      if (!record) {
        throw new Error("Deceased record not found");
      }

      if (record.chamber) {
        const chamber = await tx.chamber.findUnique({
          where: { id: record.chamber.id },
          include: { deceased: true },
        });

        if (chamber) {
          const newOccupancy = chamber.deceased.length - 1;
          await tx.chamber.update({
            where: { id: chamber.id },
            data: {
              currentOccupancy: newOccupancy,
              status:
                newOccupancy < chamber.capacity ? "AVAILABLE" : "OCCUPIED",
            },
          });
        }
      }

      await tx.deceasedRecord.delete({
        where: { id: req.query.deceased_id },
      });
    });

    res.json({ message: "Record deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
