import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export type TemplateRule = { projectId?: string; titlePattern?: string; isDefault?: boolean; createdAt?: string };
export type TemplateContent = {
  storagePath?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
  filename?: string;
  isDefault?: boolean;
  rules?: TemplateRule[];
} & Record<string, unknown>;

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @Type(() => Number)
  version!: number;

  // Json content (template metadata or structure reference)
  content!: TemplateContent;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  version?: number;

  @IsOptional()
  content?: TemplateContent;
}

export class UploadTemplateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @Type(() => Number)
  version!: number;
}

export class SetDefaultDto {
  // 空ならグローバル既定
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  titlePattern?: string; // 正規表現 or 部分一致パターン
}
