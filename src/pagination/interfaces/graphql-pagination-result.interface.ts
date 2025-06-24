import { Edge } from "./edge.interface";
import { PageInfo } from "./page-info.interface";


export interface GraphqlPaginationResult<T> {
    edges: Edge<T>[];
    pageInfo: PageInfo
}