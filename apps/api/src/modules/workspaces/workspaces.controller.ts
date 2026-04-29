import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

type AuthRequest = Request & { user: Record<string, unknown> };

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get('check-slug/:slug')
  checkSlug(@Param('slug') slug: string) {
    return this.workspacesService.checkSlug(slug);
  }

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @Req() req: AuthRequest) {
    const userId = req.user['sub'] as string;
    return this.workspacesService.create(dto, userId);
  }

  @Get('me')
  me(@Req() req: AuthRequest) {
    const userId = req.user['sub'] as string;
    return this.workspacesService.findByUser(userId);
  }
}
