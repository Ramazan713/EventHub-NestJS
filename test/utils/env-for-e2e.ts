// test/utils/env-for-e2e.ts
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// .env.test dosyasını yükle
dotenv.config({ path: resolve(__dirname, '../../.env.test') });
