
import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class LearningService {
  constructor(private db: PrismaService) {}

  async map() {
    return this.db.path.findMany({
      orderBy: { order: 'asc' },
      include: {
        islands: {
          orderBy: { order: 'asc' },
          include: {
            modules: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  }

  async island(slug: string, userId?: string) {
    const island = await this.db.island.findUnique({
      where: { slug },
      include: {
        path: true,
        modules: {
          orderBy: { order: 'asc' },
          include: {
            concepts: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!island) {
      throw new NotFoundException();
    }

    const progress = userId
      ? await this.db.progress.findMany({
          where: {
            userId,
            moduleId: {
	in: island.modules.map((item: { id: string }) => item.id),            },
          },
        })
      : [];

    return { ...island, progress };
  }

  async complete(userId: string, moduleId: string) {
    const learningModule = await this.db.module.findUnique({
      where: { id: moduleId },
    });

    if (!learningModule) {
      throw new NotFoundException();
    }

    const already = await this.db.progress.findUnique({
      where: {
        userId_moduleId: { userId, moduleId },
      },
    });

    if (already?.completed) {
      return { already: true };
    }

    return this.db.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await tx.progress.upsert({
          where: {
            userId_moduleId: { userId, moduleId },
          },
          update: {
            completed: true,
            completedAt: new Date(),
          },
          create: {
            userId,
            moduleId,
            completed: true,
            completedAt: new Date(),
          },
        });

        await tx.xpTransaction.create({
          data: {
            userId,
            amount: learningModule.xp,
            reason: 'module_completed',
            referenceId: moduleId,
          },
        });

        const user = await tx.user.update({
          where: { id: userId },
          data: {
            xp: { increment: learningModule.xp },
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            level: Math.max(1, Math.floor(user.xp / 500) + 1),
          },
        });

        return {
          completed: true,
          xp: learningModule.xp,
        };
      },
    );
  }
}

