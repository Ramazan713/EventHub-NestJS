import { Injectable } from "@nestjs/common";
import { HashingService } from "./hashing.service";
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService extends HashingService {
    

    async hash(data: string | Buffer): Promise<string> {
        const salt = await bcrypt.genSalt()
        return bcrypt.hash(data, salt)
    }

    compare(data: string | Buffer, encrypted: string): Promise<boolean> {
        return bcrypt.compare(data, encrypted)
    }

}