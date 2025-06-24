import { BadRequestException, Injectable } from "@nestjs/common";
import { PaginationQueryDto } from "../dto/pagination-query.dto";
import { CursorService } from "./cursor.service";
import { PaginationResult } from "../interfaces/pagination-result.interface";
import { PageInfo } from "../interfaces/page-info.interface";


@Injectable()
export class PaginationService {

    constructor(
        private readonly cursorService: CursorService
    ){}

    async paginate<T, Y>(
        model: any,
        options: {
            pagination: PaginationQueryDto,
            where?: any,
            include?: any,
            select?: any,
            sortBy?: string,
            sortOrder?: string,
            orderBy?: any,
            mapItems?: (item: T) => Y;
        }
    ): Promise<PaginationResult<Y>> {
        const { first, last, after, before} = options.pagination;
        
        const sortConfig = this.normalizeSortConfig(options);
        const primarySortOrder = this.getPrimarySortOrder(sortConfig);

        const isForward = first != null;
        const isBackward = last != null;
        const limit = (isForward ? first : last) ?? 10;
        const take = limit + 1;

        if (
            (first != null && last != null) ||
            (first != null && before != null) || 
            (last != null && after != null)     
        ) {
            throw new BadRequestException(
                'Invalid pagination parameters'
            );
        }

        // Effective sort order'ı tüm alanlar için hesapla
        let effectiveSortConfig = this.reverseSortConfig(sortConfig, isBackward);

        // Prisma orderBy formatında zaten hazır
        const orderBy = effectiveSortConfig;
        
        let cursorWhere = {};
        
        // After ve Before cursor'larını işle
        if (after && before) {
            // Pencere pagination: after'dan sonra VE before'dan önce
            const afterCursor = this.cursorService.decode(after);
            const beforeCursor = this.cursorService.decode(before);
            
            // ORIJINAL sıralama kullan, effective değil
            const afterOp = primarySortOrder === "asc" ? 'gt' : 'lt';
            const beforeOp = primarySortOrder === "asc" ? 'lt' : 'gt';
            
            cursorWhere = {
                AND: [
                    this.getCursorWhereQuery(afterCursor, sortConfig, afterOp),
                    this.getCursorWhereQuery(beforeCursor, sortConfig, beforeOp)
                ],
            };
        } else if (after) {
            // Sadece after - effective sıralama kullan
            const cursorObj = this.cursorService.decode(after);
            const effectivePrimaryOrder = this.getPrimarySortOrder(effectiveSortConfig);
            const cursorOp = effectivePrimaryOrder === "asc" ? 'gt' : 'lt';
            
            cursorWhere = this.getCursorWhereQuery(cursorObj, effectiveSortConfig, cursorOp);
        } else if (before) {
            // Sadece before - ORIJINAL sıralama kullan
            const cursorObj = this.cursorService.decode(before);
            const cursorOp = primarySortOrder === "asc" ? 'lt' : 'gt';
            
            cursorWhere = this.getCursorWhereQuery(cursorObj, sortConfig, cursorOp);
        }

        const where = {
            ...(options.where ?? {}),
            ...(Object.keys(cursorWhere).length > 0 ? cursorWhere : {}),
        };

        let records: [T] = await model.findMany({
            where,
            take,
            select: options.select,
            orderBy,
            include: options.include,
        });

        const hasExtra = records.length > limit;
        let slice = records.slice(0, limit);

        if (isBackward) {
            slice = slice.reverse();
        }

        let startCursor: string | undefined;
        let endCursor: string | undefined;

        if(slice.length > 0){
            startCursor = this.cursorService.encode(slice[0], sortConfig);
            endCursor = this.cursorService.encode(slice[slice.length - 1], sortConfig);
        }

        // PageInfo mantığını güncelle
        let hasNextPage = false;
        let hasPreviousPage = false;

        if (after && before) {
            // Pencere pagination için özel mantık
            hasNextPage = hasExtra; // Pencere içinde daha fazla kayıt var mı?
            hasPreviousPage = Boolean(after); // After varsa önceki sayfa vardır
        } else if (isForward) {
            hasNextPage = hasExtra;
            hasPreviousPage = Boolean(after);
        } else {
            hasNextPage = Boolean(before);
            hasPreviousPage = hasExtra;
        }

        const pageInfo: PageInfo = {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
        };

        return {
            data: slice.map((item) => options.mapItems ? options.mapItems(item) : item) as [Y],
            pageInfo,
            sortConfig
        };
    }

    private normalizeSortConfig(options: any): Array<Record<string, any>> {
        // Eğer orderBy varsa onu normalize et
        if (options.orderBy) {
            // Eğer array değilse array yap
            return Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy];
        }
        
        // Geriye dönük uyumluluk için eski parametreleri kullan
        const sortBy = options.sortBy || 'id';
        const sortOrder = options.sortOrder || 'asc';
        
        return [{ [sortBy]: sortOrder }];
    }

    private getPrimarySortOrder(sortConfig: Array<Record<string, any>>): string {
        const firstSort = sortConfig[0];
        const firstKey = Object.keys(firstSort)[0];
        const value = firstSort[firstKey];
        
        // Eğer nested object ise (örn: { user: { name: 'asc' } })
        // içindeki ilk order'ı al
        if (typeof value === 'object' && value !== null) {
            const nestedKey = Object.keys(value)[0];
            return value[nestedKey]?.toLowerCase();
        }
        
        // Basit durum (örn: { name: 'asc' })
        return value?.toLowerCase();
    }

    private getCursorWhereQuery(
        cursorObject: any, 
        sortConfig: Array<Record<string, any>>, 
        cursorOp: string
    ) {
        // Çoklu alan sıralaması için daha karmaşık where query'si oluştur
        const conditions: any[] = [];
        
        // Her sıralama alanı için koşul oluştur
        for (let i = 0; i < sortConfig.length; i++) {
            const currentSortItem = sortConfig[i];
            const fieldName = Object.keys(currentSortItem)[0];
            
            // Nested sorting varsa cursor için kullanamayız, skip et
            const fieldValue = currentSortItem[fieldName];
            if (typeof fieldValue === 'object' && fieldValue !== null) {
                continue; // Nested field'ları cursor query'sinde kullanamayız
            }
            
            if (i === sortConfig.length - 1) {
                // Son alan için direkt karşılaştırma
                if (fieldName === 'id') {
                    conditions.push({
                        [fieldName]: { [cursorOp]: cursorObject.id }
                    });
                } else {
                    conditions.push({
                        OR: [
                            { [fieldName]: { [cursorOp]: cursorObject[fieldName] } },
                            {
                                AND: [
                                    { [fieldName]: cursorObject[fieldName] },
                                    { id: { [cursorOp]: cursorObject.id } }
                                ]
                            }
                        ]
                    });
                }
            } else {
                // Önceki alanlar için eşitlik koşulu + bu alan için karşılaştırma
                const equalityConditions: any = {};
                for (let j = 0; j < i; j++) {
                    const prevSortItem = sortConfig[j];
                    const prevField = Object.keys(prevSortItem)[0];
                    const prevFieldValue = prevSortItem[prevField];
                    
                    // Nested field'ları skip et
                    if (typeof prevFieldValue === 'object' && prevFieldValue !== null) {
                        continue;
                    }
                    
                    equalityConditions[prevField] = cursorObject[prevField];
                }
                
                if (Object.keys(equalityConditions).length > 0) {
                    conditions.push({
                        AND: [
                            equalityConditions,
                            { [fieldName]: { [cursorOp]: cursorObject[fieldName] } }
                        ]
                    });
                } else {
                    conditions.push({
                        [fieldName]: { [cursorOp]: cursorObject[fieldName] }
                    });
                }
            }
        }
        
        return conditions.length === 1 ? conditions[0] : { OR: conditions };
    }

    private reverseSortConfig(sortConfig: Array<Record<string, any>>, shouldReverse: boolean): Array<Record<string, any>> {
        if (!shouldReverse) {
            return [...sortConfig];
        }

        return sortConfig.map(sortItem => {
            const field = Object.keys(sortItem)[0];
            const value = sortItem[field];
            
            // Eğer nested object ise (örn: { user: { name: 'asc' } })
            if (typeof value === 'object' && value !== null) {
                const reversedNested: any = {};
                Object.keys(value).forEach(nestedKey => {
                    const nestedValue = value[nestedKey];
                    reversedNested[nestedKey] = nestedValue === 'asc' ? 'desc' : 'asc';
                });
                return { [field]: reversedNested };
            }
            
            // Basit durum (örn: { name: 'asc' })
            return { [field]: value === 'asc' ? 'desc' : 'asc' };
        });
    }
}