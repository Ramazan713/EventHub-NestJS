import { Injectable } from "@nestjs/common";
import { PaginationResult } from "../interfaces/pagination-result.interface";
import { GraphqlPaginationResult } from "../interfaces/graphql-pagination-result.interface";
import { CursorService } from "../services/cursor.service";


@Injectable()
export class GraphQLPaginationFormatter {

    constructor(
        private readonly cursorService: CursorService
    ){}


    format<T>(paginationResult: PaginationResult<T>): GraphqlPaginationResult<T> {
        const { pageInfo, data, sortConfig } = paginationResult
        const edges = data.map(item => ({
            node: item,
            cursor: this.cursorService.encode(item, sortConfig)
        }))

        return {
            pageInfo,
            edges,
        }
    }
}