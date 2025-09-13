import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

import { ReportContentItemDto } from '../../common/dto/report-content.dto';
import { IsReportContentItem } from '../../common/validators/report-content.validator';


export type ExportContentItem = unknown;
export type ExportMetadata = Record<string, unknown>;

@ApiExtraModels(ReportContentItemDto)
export class StartExportDto {
  @IsString()
  title!: string;

  // ReportContentItem[] を JSON で受ける
  @IsArray()
  @ApiProperty({ type: 'array', items: { oneOf: [
    { $ref: getSchemaPath(ReportContentItemDto) }
  ]}})
  @IsReportContentItem({ each: true })
  content!: ExportContentItem[];

  @IsOptional()
  metadata?: ExportMetadata;

  // テンプレートのいずれかを指定（未指定時は既定自動選択）
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  templatePath?: string;

  @IsOptional()
  @IsIn(['pptx', 'pdf'])
  format?: 'pptx' | 'pdf';
}
