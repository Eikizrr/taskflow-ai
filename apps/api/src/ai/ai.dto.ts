import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Priority } from '@prisma/client';

export class AskAiDto {
  @IsString() @MinLength(3) @MaxLength(4000) message!: string;
}
export class PlanAiDto {
  @IsString() @MinLength(3) @MaxLength(4000) prompt!: string;
  @IsOptional() @IsString() projectId?: string;
}
export class PlannedTaskDto {
  @IsString() @MinLength(2) @MaxLength(180) title!: string;
  @IsString() @MaxLength(2000) description!: string;
  @IsEnum(Priority) priority!: Priority;
  @IsInt() @Min(1) @Max(160) estimateHours!: number;
}
export class ApplyPlanDto {
  @IsString() projectId!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlannedTaskDto)
  tasks!: PlannedTaskDto[];
}
