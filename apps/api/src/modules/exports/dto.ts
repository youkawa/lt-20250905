import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export type ExportContentItem = unknown;
export type ExportMetadata = Record<string, unknown>;

export class StartExportDto {
  @IsString()
  title!: string;

  // ReportContentItem[] を JSON で受ける
  @IsArray()
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
