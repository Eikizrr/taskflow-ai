import {
  Body,
  Controller,
  Get,
  Param,
  ParseFilePipeBuilder,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { AuthUser } from '../auth/jwt.strategy';
import { CreateCommentDto } from './collaboration.dto';
import { CollaborationService } from './collaboration.service';
@UseGuards(AuthGuard('jwt'))
@Controller()
export class CollaborationController {
  constructor(private collaboration: CollaborationService) {}
  @Get('tasks/:taskId/comments') comments(
    @Req() req: { user: AuthUser },
    @Param('taskId') taskId: string,
  ) {
    return this.collaboration.comments(taskId, req.user.organizationId);
  }
  @Post('tasks/:taskId/comments') addComment(
    @Req() req: { user: AuthUser },
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.collaboration.addComment(
      taskId,
      req.user.organizationId,
      req.user.userId,
      dto.body,
    );
  }
  @Post('tasks/:taskId/attachments')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }),
  )
  upload(
    @Req() req: { user: AuthUser },
    @Param('taskId') taskId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({ maxSize: 20 * 1024 * 1024 })
        .addFileTypeValidator({
          fileType:
            /(pdf|png|jpe?g|gif|webp|plain|csv|zip|msword|officedocument|spreadsheet|presentation)/,
        })
        .build(),
    )
    file: Express.Multer.File,
  ) {
    return this.collaboration.attach(taskId, req.user.organizationId, file);
  }
  @Get('attachments/:id/download') async download(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { item, stream } = await this.collaboration.attachment(
      id,
      req.user.organizationId,
    );
    res.setHeader('Content-Type', item.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`,
    );
    stream.pipe(res);
  }
  @Get('notifications') notifications(@Req() req: { user: AuthUser }) {
    return this.collaboration.notifications(req.user.userId);
  }
  @Patch('notifications/read-all') readAll(@Req() req: { user: AuthUser }) {
    return this.collaboration.readAll(req.user.userId);
  }
  @Patch('notifications/:id/read') read(
    @Req() req: { user: AuthUser },
    @Param('id') id: string,
  ) {
    return this.collaboration.readNotification(id, req.user.userId);
  }
}
