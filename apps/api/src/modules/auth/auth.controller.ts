import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

interface SyncUserDto {
  id: string;
  email: string;
  name?: string;
}

@Controller('auth')
export class AuthController {
  @Post('sync')
  @UseGuards(JwtAuthGuard)
  sync(@Body() body: SyncUserDto) {
    return {
      synced: true,
      userId: body.id,
      email: body.email,
    };
  }
}
