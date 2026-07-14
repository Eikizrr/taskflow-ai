import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdatePreferencesDto,
} from './auth.dto';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from './jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Throttle({ default: { limit: 5, ttl: 60000 } }) @Post('register') register(
    @Body() dto: RegisterDto,
  ) {
    return this.auth.register(dto);
  }
  @Throttle({ default: { limit: 8, ttl: 60000 } }) @Post('login') login(
    @Body() dto: LoginDto,
  ) {
    return this.auth.login(dto);
  }
  @UseGuards(AuthGuard('jwt')) @Get('me') me(@Req() req: { user: AuthUser }) {
    return req.user;
  }
  @UseGuards(AuthGuard('jwt')) @Patch('profile') profile(
    @Req() req: { user: AuthUser },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.auth.updateProfile(req.user.userId, dto.name);
  }
  @UseGuards(AuthGuard('jwt')) @Patch('preferences') preferences(
    @Req() req: { user: AuthUser },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.auth.updatePreferences(req.user.userId, dto);
  }
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }
}
