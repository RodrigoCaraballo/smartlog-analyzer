import { ApiProperty } from '@nestjs/swagger';
import { LogResponseDto } from './log-response.dto';

export class PaginatedLogsResponseDto {
  @ApiProperty({ type: [LogResponseDto] })
  items!: LogResponseDto[];

  @ApiProperty({ example: 1 }) page!: number;
  @ApiProperty({ example: 20 }) limit!: number;
  @ApiProperty({ example: 145 }) total!: number;
  @ApiProperty({ example: 8 }) totalPages!: number;
}
