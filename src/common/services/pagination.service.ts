import { BadRequestException, Injectable } from "@nestjs/common";
import { List } from "lodash";
import { PageInfoDto } from "../dto/page-info.dto";
import { PaginationQueryDto } from "../dto/pagination-query.dto";
import { string } from "joi";
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
            (first != null && before != null) ||
            (last  != null && after  != null) ||
            (first != null && last  != null) ||
            (after != null && before != null)
        ) {
            throw new BadRequestException(
                'Invalid pagination parameters: cannot use first with before or last with after'
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
        
        let cursorObj: { lastValue: any; lastId: number } | undefined;
        let cursorOp: 'gt' | 'lt' = 'gt';
        if (after) {
            cursorObj = this.decodeCursor(after);
            cursorOp = effectiveSortOrder === "asc" ? 'gt' : 'lt';
        } else if (before) {
            cursorObj = this.decodeCursor(before);
            cursorOp = effectiveSortOrder === "desc" ? 'lt' : 'gt';
        }else{
            cursorOp = effectiveSortOrder === "asc" ? 'lt' : 'gt';
        }
        

        let cursorWhere = {};
        if (cursorObj) {
        const { lastValue, lastId } = cursorObj;
        cursorWhere = {
            OR: [
                    { [sortBy]: { [cursorOp]: lastValue } },
                    {
                        AND: [
                            { [sortBy]: lastValue },
                            { id: { [cursorOp]: lastId } },
                        ],
                    },
                ],
            };
        }

        const where = {
            ...(options.where ?? {}),
            ...(cursorObj ? cursorWhere : {}),
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

        const pageInfo: PageInfoDto = {
            hasNextPage: isForward ? hasExtra : Boolean(before),
            hasPreviousPage: isForward ? Boolean(after) : hasExtra,
            startCursor: startCursor,
            endCursor: endCursor,
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

}