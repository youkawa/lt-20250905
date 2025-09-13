import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

import { ReportContentItemDto } from '../../common/dto/report-content.dto';
import { IsReportContentItem } from '../../common/validators/report-content.validator';


export type ExportContentItem = unknown;
export type ExportMetadata = Record<string, unknown>;

@ApiExtraModels(ReportContentItemDto)
export class StartExportDto {
  @IsString()
  @ApiProperty({ example: 'Weekly Report' })
  title!: string;

  // ReportContentItem[] を JSON で受ける
  @IsArray()
  @ApiProperty({ type: 'array', items: { oneOf: [
    { $ref: getSchemaPath(ReportContentItemDto) }
  ]}})
  @IsReportContentItem({ each: true })
  content!: ExportContentItem[];

  @IsOptional()
  @ApiProperty({ required: false, example: { projectId: 'p1', reportId: 'r1' } })
  metadata?: ExportMetadata;

  // テンプレートのいずれかを指定（未指定時は既定自動選択）
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'tpl_123' })
  templateId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: '/templates/acme.pptx' })
  templatePath?: string;

  @IsOptional()
  @IsIn(['pptx', 'pdf'])
  @ApiProperty({ required: false, enum: ['pptx','pdf'], example: 'pptx' })
  format?: 'pptx' | 'pdf';
}
