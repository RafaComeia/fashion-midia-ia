import { ConflictException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FashionSegment } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

const mockWorkspace = {
  id: 'ws-uuid-1',
  name: 'Mazzara Fashion',
  slug: 'mazzara-fashion',
  segment: 'casual',
  logoUrl: null,
  plan: 'free',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  workspace: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  workspaceMember: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      admin: {
        updateUserById: jest.fn().mockResolvedValue({ data: {}, error: null }),
      },
    },
  }),
}));

describe('WorkspacesService', () => {
  let service: WorkspacesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
    jest.clearAllMocks();
  });

  describe('checkSlug', () => {
    it('deve retornar available: true quando slug não existe', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      const result = await service.checkSlug('novo-slug');
      expect(result).toEqual({ available: true });
    });

    it('deve retornar available: false quando slug já existe', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);
      const result = await service.checkSlug('mazzara-fashion');
      expect(result).toEqual({ available: false });
    });
  });

  describe('create', () => {
    const dto = {
      name: 'Mazzara Fashion',
      slug: 'mazzara-fashion',
      segment: FashionSegment.casual,
    };

    it('deve criar workspace e registrar usuário como admin', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(null);
      mockPrisma.$transaction.mockImplementation(
        async (fn: (tx: typeof mockPrisma) => Promise<typeof mockWorkspace>) =>
          fn(mockPrisma),
      );
      mockPrisma.workspace.create.mockResolvedValue(mockWorkspace);
      mockPrisma.workspaceMember.create.mockResolvedValue({});

      const result = await service.create(dto, 'user-uuid-1');

      expect(result).toEqual(mockWorkspace);

      expect(mockPrisma.workspace.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ slug: 'mazzara-fashion' }),
        }),
      );

      expect(mockPrisma.workspaceMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ role: 'admin' }),
        }),
      );
    });

    it('deve lançar ConflictException quando slug já está em uso', async () => {
      mockPrisma.workspace.findUnique.mockResolvedValue(mockWorkspace);

      await expect(service.create(dto, 'user-uuid-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findByUser', () => {
    it('deve retornar workspace do usuário', async () => {
      mockPrisma.workspaceMember.findFirst.mockResolvedValue({
        workspace: mockWorkspace,
      });

      const result = await service.findByUser('user-uuid-1');
      expect(result).toEqual(mockWorkspace);
    });

    it('deve retornar null se usuário não tem workspace', async () => {
      mockPrisma.workspaceMember.findFirst.mockResolvedValue(null);

      const result = await service.findByUser('user-uuid-1');
      expect(result).toBeNull();
    });
  });
});
