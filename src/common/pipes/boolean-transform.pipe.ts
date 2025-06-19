
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export function IsBooleanString() {
  return applyDecorators(
    Transform(({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      if (typeof value === 'boolean') return value;
      return value;
    }),
    IsBoolean(),
  );
}