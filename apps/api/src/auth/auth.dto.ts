import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @MinLength(2) organizationName!: string;
}
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
export class UpdateProfileDto {
  @IsString() @MinLength(2) name!: string;
}
export class ForgotPasswordDto {
  @IsEmail() email!: string;
}
export class ResetPasswordDto {
  @IsString() @MinLength(20) token!: string;
  @IsString() @MinLength(8) password!: string;
}
export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() mentions?: boolean;
  @IsOptional() @IsBoolean() deadline?: boolean;
  @IsOptional() @IsBoolean() weekly?: boolean;
  @IsOptional() @IsString() timezone?: string;
}
