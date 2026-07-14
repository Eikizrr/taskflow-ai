import {
  IsDateString,
  IsEnum,
  IsHexColor,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ProjectStatus } from '@prisma/client';
export class CreateProjectDto {
  @IsString() @MinLength(2) name!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsHexColor() color?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() dueDate?: string;
}
export class UpdateProjectDto extends CreateProjectDto {
  @IsOptional() @IsString() declare name: string;
  @IsOptional() @IsEnum(ProjectStatus) status?: ProjectStatus;
}
