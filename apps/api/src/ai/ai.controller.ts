import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUser } from '../auth/jwt.strategy';
import { AiService } from './ai.service';
import { ApplyPlanDto, AskAiDto, PlanAiDto } from './ai.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private ai: AiService) {}
  @Post('ask') ask(@Req() req: { user: AuthUser }, @Body() dto: AskAiDto) {
    return this.ai.ask(req.user.userId, req.user.organizationId, dto.message);
  }
  @Post('plan') plan(@Req() req: { user: AuthUser }, @Body() dto: PlanAiDto) {
    return this.ai.plan(
      req.user.userId,
      req.user.organizationId,
      dto.prompt,
      dto.projectId,
    );
  }
  @Post('apply-plan') apply(
    @Req() req: { user: AuthUser },
    @Body() dto: ApplyPlanDto,
  ) {
    return this.ai.applyPlan(req.user.userId, req.user.organizationId, dto);
  }
}
