import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class CodeOutputDto {
  @ApiProperty()
  output_type!: string;

  @ApiProperty({ required: false, example: "stdout" })
  text?: string;

  @ApiProperty({ required: false, type: 'object', additionalProperties: true, example: { 'image/png': '<BASE64>' } })
  data?: Record<string, unknown>;

  @ApiProperty({ required: false, type: 'object', additionalProperties: true, example: { isolated: true } })
  metadata?: Record<string, unknown>;
}

export class NotebookMarkdownItemDto {
  @ApiProperty({ enum: ['notebook_markdown'] })
  type!: 'notebook_markdown';

  @ApiProperty({ example: "# Title\nSome markdown..." })
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

  @ApiProperty({ example: "print('hello')" })
  source!: string;

  @ApiProperty({ type: 'array', items: { $ref: getSchemaPath(CodeOutputDto) }, example: [ { output_type: 'stream', text: 'hello' } ] })
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

  @ApiProperty({ example: "<p>任意のHTMLテキスト</p>" })
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
