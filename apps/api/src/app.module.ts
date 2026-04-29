import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';

@Module({
  imports: [PrismaModule, AuthModule, WorkspacesModule],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
