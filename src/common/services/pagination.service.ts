import { BadRequestException, Injectable } from "@nestjs/common";
import { PageInfoDto } from "../dto/page-info.dto";
import { PaginationQueryDto } from "../dto/pagination-query.dto";
import { PaginationResult } from "../interfaces/pagination-result.interface";


@Injectable()
export class PaginationService {

    async paginate<T, Y>(
        model: any,
        options: {
            pagination: PaginationQueryDto,
            where?: any,
            include?: any,
            select?: any,
            sortBy?: string,
            sortOrder?: string,
            mapItems?: (item: T) => Y;
        }
    ): Promise<PaginationResult<Y>> {
        const { first, last, after, before} = options.pagination;
        const { sortBy = 'id', sortOrder = "asc" } = options

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

        let effectiveSortOrder = sortOrder;
        if (isBackward) {
            effectiveSortOrder = sortOrder === "asc" ? "desc" : "asc";
        }

        const orderBy = [
            { [sortBy]: effectiveSortOrder },
            { id: effectiveSortOrder },
        ];
        
        let cursorWhere = {};
        
        // After ve Before cursor'larını işle
        if (after && before) {
            // Pencere pagination: after'dan sonra VE before'dan önce
            const afterCursor = this.decodeCursor(after);
            const beforeCursor = this.decodeCursor(before);
            
            // ORIJINAL sıralama kullan, effective değil
            const afterOp = sortOrder === "asc" ? 'gt' : 'lt';
            const beforeOp = sortOrder === "asc" ? 'lt' : 'gt';
            
            cursorWhere = {
                AND: [
                    this.getCursorWhereQuery(afterCursor, sortBy, afterOp),
                    this.getCursorWhereQuery(beforeCursor, sortBy, beforeOp)
                ],
            };
        } else if (after) {
            // Sadece after - effective sıralama kullan
            const cursorObj = this.decodeCursor(after);
            const cursorOp = effectiveSortOrder === "asc" ? 'gt' : 'lt';
            
            cursorWhere =  this.getCursorWhereQuery(cursorObj, sortBy, cursorOp)
        } else if (before) {
            // Sadece before - ORIJINAL sıralama kullan
            const cursorObj = this.decodeCursor(before);
            const cursorOp = sortOrder === "asc" ? 'lt' : 'gt';
            
            cursorWhere = this.getCursorWhereQuery(cursorObj, sortBy, cursorOp)
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
            startCursor = this.encodeCursor(slice[0], sortBy);
            endCursor = this.encodeCursor(slice[slice.length - 1], sortBy);
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

        const pageInfo: PageInfoDto = {
            hasNextPage,
            hasPreviousPage,
            startCursor,
            endCursor,
        };

        return {
            data: slice.map((item) => options.mapItems ? options.mapItems(item) : item) as [Y],
            pageInfo
        };
    }

    private encodeCursor(item: any, sortBy: string,): string {
        return Buffer.from(JSON.stringify({ lastId: item.id, lastValue: item[sortBy] })).toString('base64');
    }

    private decodeCursor(cursor: string): any {
        return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    }

    private getCursorWhereQuery(cursorObject: any, sortBy: string, cursorOp: string) {
        return {
            OR: [
                { [sortBy]: { [cursorOp]: cursorObject.lastValue } },
                {
                    AND: [
                        { [sortBy]: cursorObject.lastValue },
                        { id: { [cursorOp]: cursorObject.lastId } },
                    ],
                },
            ],
        }
    }

}