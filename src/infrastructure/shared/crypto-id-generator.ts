import { randomUUID } from 'node:crypto';
import type { IdGenerator } from '../../domain/shared/ports/id-generator';

export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
