import { Injectable } from "@nestjs/common";


@Injectable()
export class CursorService {


    encode(item: any, sortConfig: Array<Record<string, any>>){
        const cursorData: any = { id: item.id };
        
        sortConfig.forEach(sortItem => {
            const field = Object.keys(sortItem)[0];
            if (field !== 'id') {
                // Nested field'lar için sadece top-level field'ı cursor'a ekle
                // Çünkü cursor sadece primitive değerlerle çalışabilir
                cursorData[field] = item[field];
            }
        });
        
        return Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }

    decode(cursor: string): any {
        return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    }

}