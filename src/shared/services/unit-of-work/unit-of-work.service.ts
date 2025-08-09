import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../core/config/prisma/prisma.service"

@Injectable()
export class UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async transaction<T>(
    callback: (prismaClient: PrismaService) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction((transactionClient) =>
      callback(transactionClient as any),
    );
  }
}