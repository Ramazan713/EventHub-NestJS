import { PageInfo } from "./page-info.interface";


export interface RestPaginationResult<T> {
    data: T[],
    pageInfo: PageInfo
}