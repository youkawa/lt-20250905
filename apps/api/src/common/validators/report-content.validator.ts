import { registerDecorator, ValidationOptions } from 'class-validator';

function isCodeOutput(o: any): boolean {
  return o && typeof o === 'object' && typeof o.output_type === 'string';
}

export function isReportContentItem(v: any): boolean {
  if (!v || typeof v !== 'object') return false;
  const t = (v as any).type;
  if (t === undefined) return true; // allow placeholder/minimal items for legacy payloads
  if (t === 'notebook_markdown') {
    return typeof (v as any).source === 'string';
  }
  if (t === 'notebook_code') {
    if (typeof (v as any).source !== 'string') return false;
    const outputs = (v as any).outputs;
    return Array.isArray(outputs) && outputs.every(isCodeOutput);
  }
  if (t === 'text_box') {
    return typeof (v as any).content === 'string';
  }
  return false;
}

export function IsReportContentItem(options?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsReportContentItem',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: any) {
          return isReportContentItem(value);
        },
        defaultMessage() {
          return 'Invalid ReportContentItem shape';
        },
      },
    });
  };
}
