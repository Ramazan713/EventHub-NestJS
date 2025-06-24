import { Injectable } from "@nestjs/common";
import { PaginationResult } from "../interfaces/pagination-result.interface";
import { RestPaginationResult } from "../interfaces/rest-pagination-result.interface";


@Injectable()
export class RestPaginationFormatter {

    format<T>(paginationResult: PaginationResult<T>): RestPaginationResult<T> {
        return {
            pageInfo: paginationResult.pageInfo,
            data: paginationResult.data
        }
    }
}