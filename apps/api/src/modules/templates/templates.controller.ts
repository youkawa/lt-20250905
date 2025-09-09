import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, UploadTemplateDto, SetDefaultDto } from './dto';
import { AdminGuard } from '../../common/auth/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list() {
    return this.templates.list();
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateTemplateDto) {
    return this.templates.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.templates.get(id);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.templates.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.templates.remove(id);
  }

  @UseGuards(AdminGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    // 型定義の有無に依存せず動作させるため any を使用（テスト時の型エラー回避）
    @UploadedFile() file: any,
    @Body() dto: UploadTemplateDto,
  ) {
    if (!file) throw new BadRequestException('file is required');
    const mime = file.mimetype || '';
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pptx' && mime !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      throw new BadRequestException('Only .pptx is supported');
    }
    const baseDir = process.env.TEMPLATES_DIR || '/app/uploads/templates';
    await fs.mkdir(baseDir, { recursive: true });
    const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.pptx`;
    const fullpath = path.join(baseDir, filename);
    await fs.writeFile(fullpath, file.buffer);
    const content = {
      storagePath: fullpath,
      originalName: file.originalname,
      mimeType: mime,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      filename,
    };
    return this.templates.create({ title: dto.title, version: dto.version, content });
  }

  @UseGuards(AdminGuard)
  @Post(':id/default')
  setDefault(@Param('id') id: string, @Body() body: SetDefaultDto) {
    return this.templates.setDefault(id, body);
  }
}
