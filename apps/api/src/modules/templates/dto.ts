import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsRegexPattern } from '../../common/validators/regex.validator';

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
  @ApiProperty({ example: 'Acme Corporate' })
  title!: string;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ example: 1 })
  version!: number;

  // Json content (template metadata or structure reference)
  @ApiProperty({ example: { storagePath: '/t/acme-v1.pptx', originalName: 'acme.pptx' } })
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
  @ApiProperty({ example: 'Acme Corporate' })
  title!: string;

  @IsInt()
  @Type(() => Number)
  @ApiProperty({ example: 1 })
  version!: number;
}

export class SetDefaultDto {
  // 空ならグローバル既定
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'p1' })
  projectId?: string;

  @IsOptional()
  @IsString()
  @IsRegexPattern({ message: 'titlePattern must be a valid RegExp string' })
  @ApiProperty({ required: false, example: '^Q[1-4]\\s' })
  titlePattern?: string; // 正規表現 or 部分一致パターン
}
