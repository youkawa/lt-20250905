import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ReportContentItemDto } from '../../common/dto/report-content.dto';
import { IsReportContentItem } from '../../common/validators/report-content.validator';

export type ReportContentItem = unknown;
export type ReportMetadata = Record<string, unknown>;

@ApiExtraModels(ReportContentItemDto)
export class CreateReportDto {
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  // content は Json として受ける
  @IsArray()
  @ApiProperty({ type: 'array', items: { oneOf: [ { $ref: getSchemaPath(ReportContentItemDto) } ] } })
  @IsReportContentItem({ each: true })
  content!: ReportContentItem[];

  @IsOptional()
  metadata?: ReportMetadata;
}

export class UpdateReportDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  @IsArray()
  @ApiProperty({ required: false, type: 'array', items: { oneOf: [ { $ref: getSchemaPath(ReportContentItemDto) } ] } })
  @IsReportContentItem({ each: true })
  content?: ReportContentItem[];

  @IsOptional()
  metadata?: ReportMetadata;
}

export class PaginationQuery {
  @IsOptional()
  @IsInt()
  take?: number;
  @IsOptional()
  @IsString()
  cursor?: string;
}
