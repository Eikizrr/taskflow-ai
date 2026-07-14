import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { AiModule } from './ai/ai.module';
import { RealtimeModule } from './realtime/realtime.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { TeamModule } from './team/team.module';
import { APP_GUARD } from '@nestjs/core';
import { DashboardModule } from './dashboard/dashboard.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { SearchModule } from './search/search.module';
import { ActivityModule } from './activity/activity.module';
import { StorageModule } from './storage/storage.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    TasksModule,
    AiModule,
    RealtimeModule,
    CollaborationModule,
    TeamModule,
    DashboardModule,
    WorkspaceModule,
    SearchModule,
    ActivityModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
