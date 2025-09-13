import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsRegexPattern(options?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsRegexPattern',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: any) {
          if (value === undefined || value === null || value === '') return true;
          if (typeof value !== 'string') return false;
          try {
            // Allow raw string; anchors optional. Avoid ReDoS by limiting length (basic guard)
            if (value.length > 5000) return false;
            // eslint-disable-next-line no-new
            new RegExp(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return 'titlePattern must be a valid JavaScript regular expression string';
        },
      },
    });
  };
}

