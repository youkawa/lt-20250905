import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';

export class StartExportDto {
  @IsString()
  title!: string;

  // ReportContentItem[] を JSON で受ける
  @IsArray()
  content!: any[];

  @IsOptional()
  metadata?: any;

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
