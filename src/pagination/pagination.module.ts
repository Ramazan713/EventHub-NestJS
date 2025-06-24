import { Global, Module } from '@nestjs/common';
import { PaginationService } from './services/pagination.service';
import { CursorService } from './services/cursor.service';
import { GraphQLPaginationFormatter } from './formetters/graphql-pagination.formatter';
import { RestPaginationFormatter } from './formetters/rest-pagination.formatter';

@Global()
@Module({
    providers: [
        PaginationService,
        CursorService,
        GraphQLPaginationFormatter,
        RestPaginationFormatter
    ],
    exports: [
        PaginationService,
        GraphQLPaginationFormatter,
        RestPaginationFormatter,
        CursorService,
    ],
})
export class PaginationModule {}
