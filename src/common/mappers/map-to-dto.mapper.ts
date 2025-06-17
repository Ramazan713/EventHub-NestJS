import { ClassConstructor, plainToInstance } from "class-transformer";


export function mapToDto<R,T>(
    dto: ClassConstructor<T>,
    raw: R,
) {
    return plainToInstance(dto, raw, { excludeExtraneousValues: true });
}