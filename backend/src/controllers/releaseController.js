import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create release record
export const createReleaseRecord = async (req, res) => {
  try {
    const { deceasedId, releasedTo, relationship, releaseDate, documents, remarks } = req.body;

    const deceased = await prisma.deceasedRecord.findUnique({
      where: { id: deceasedId }
    });

    if (!deceased) {
      return res.status(404).json({ error: 'Deceased record not found' });
    }

    if (deceased.status === 'RELEASED') {
      return res.status(400).json({ error: 'Deceased has already been released' });
    }

    const releaseRecord = await prisma.$transaction(async (prisma) => {
      // Create release record
      const release = await prisma.releaseRecord.create({
        data: {
          deceasedId,
          releasedTo,
          relationship,
          releaseDate: new Date(releaseDate),
          documents,
          remarks
        }
      });

      // Update deceased record status
      await prisma.deceasedRecord.update({
        where: { id: deceasedId },
        data: { status: 'RELEASED' }
      });

      return release;
    });

    res.status(201).json(releaseRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get release record by deceased ID
export const getReleaseRecordByDeceasedId = async (req, res) => {
  try {
    const { deceasedId } = req.params;

    const releaseRecord = await prisma.releaseRecord.findUnique({
      where: { deceasedId }
    });

    if (!releaseRecord) {
      return res.status(404).json({ error: 'Release record not found' });
    }

    res.status(200).json(releaseRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update release record
export const updateReleaseRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { releasedTo, relationship, releaseDate, documents, remarks } = req.body;

    const releaseRecord = await prisma.releaseRecord.update({
      where: { id },
      data: {
        releasedTo,
        relationship,
        releaseDate: new Date(releaseDate),
        documents,
        remarks
      }
    });

    res.status(200).json(releaseRecord);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get release statistics
export const getReleaseStats = async (req, res) => {
  try {
    const totalReleases = await prisma.releaseRecord.count();
    
    const releasesByMonth = await prisma.releaseRecord.groupBy({
      by: ['releaseDate'],
      _count: {
        _all: true
      },
      orderBy: {
        releaseDate: 'desc'
      },
      take: 12
    });

    res.status(200).json({
      totalReleases,
      releasesByMonth
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
