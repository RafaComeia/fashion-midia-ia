import { ConflictException, Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async checkSlug(slug: string): Promise<{ available: boolean }> {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug },
    });
    return { available: !existing };
  }

  async create(dto: CreateWorkspaceDto, userId: string) {
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(
        'Slug já está em uso. Escolha outro nome para sua marca.',
      );
    }

    const workspace = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workspace.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          segment: dto.segment ?? null,
          logoUrl: dto.logoUrl ?? null,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: created.id,
          userId,
          role: 'admin',
          joinedAt: new Date(),
        },
      });

      return created;
    });

    await this.updateUserMetadata(userId, workspace.id);

    return workspace;
  }

  async findByUser(userId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      include: { workspace: true },
    });
    return member?.workspace ?? null;
  }

  private async updateUserMetadata(userId: string, workspaceId: string) {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { workspace_id: workspaceId },
    });
  }
}
