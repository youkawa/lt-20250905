import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class CodeOutputDto {
  @ApiProperty()
  output_type!: string;

  @ApiProperty({ required: false })
  text?: string;

  @ApiProperty({ required: false, type: 'object', additionalProperties: true })
  data?: Record<string, unknown>;

  @ApiProperty({ required: false, type: 'object', additionalProperties: true })
  metadata?: Record<string, unknown>;
}

export class NotebookMarkdownItemDto {
  @ApiProperty({ enum: ['notebook_markdown'] })
  type!: 'notebook_markdown';

  @ApiProperty()
  source!: string;

  @ApiProperty({ required: false, type: 'object', properties: {
    notebookName: { type: 'string' },
    cellIndex: { type: 'number' }
  }})
  origin?: { notebookName: string; cellIndex: number };
}

export class NotebookCodeItemDto {
  @ApiProperty({ enum: ['notebook_code'] })
  type!: 'notebook_code';

  @ApiProperty()
  source!: string;

  @ApiProperty({ type: 'array', items: { $ref: getSchemaPath(CodeOutputDto) } })
  outputs!: CodeOutputDto[];

  @ApiProperty({ required: false, type: 'object', properties: {
    notebookName: { type: 'string' },
    cellIndex: { type: 'number' }
  }})
  origin?: { notebookName: string; cellIndex: number };
}

export class TextBoxItemDto {
  @ApiProperty({ enum: ['text_box'] })
  type!: 'text_box';

  @ApiProperty()
  content!: string;
}

@ApiExtraModels(NotebookMarkdownItemDto, NotebookCodeItemDto, TextBoxItemDto, CodeOutputDto)
export class ReportContentItemDto {
  // placeholder; used only for schema composition
  @ApiProperty({ oneOf: [
    { $ref: getSchemaPath(NotebookMarkdownItemDto) },
    { $ref: getSchemaPath(NotebookCodeItemDto) },
    { $ref: getSchemaPath(TextBoxItemDto) }
  ]})
  _!: unknown;
}

