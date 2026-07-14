import { Module } from '@nestjs/common';
import { WorkspaceController } from './workspace.controller';
import { RolesGuard } from '../auth/roles.guard';
@Module({ controllers: [WorkspaceController], providers: [RolesGuard] })
export class WorkspaceModule {}
