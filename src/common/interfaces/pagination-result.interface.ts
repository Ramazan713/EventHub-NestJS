import { PageInfoDto } from "../dto/page-info.dto";


export interface PaginationResult<T> {
    data: T[],
    pageInfo: PageInfoDto
}