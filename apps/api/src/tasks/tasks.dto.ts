import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Priority, TaskStatus } from '@prisma/client';
export class CreateTaskDto {
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsString() projectId!: string;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsString() parentId?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsDateString() dueDate?: string;
}
export class UpdateTaskDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(TaskStatus) status?: TaskStatus;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsString() assigneeId?: string;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsNumber() position?: number;
}
