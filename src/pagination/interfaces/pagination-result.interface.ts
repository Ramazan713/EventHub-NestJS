import { PageInfo } from "./page-info.interface";


export interface PaginationResult<T> {
    data: T[],
    pageInfo: PageInfo
    sortConfig: Array<Record<string, any>>
}