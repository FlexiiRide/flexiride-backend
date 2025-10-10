import {
  IsString,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  ValidateNested,
  IsArray,
  Min,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Define proper types to avoid 'any'
type VehicleType = 'car' | 'bike';

interface ParsedLocation {
  address: string;
  lat?: number;
  lng?: number;
}

interface ParsedAvailableRange {
  from: string;
  to: string;
}

class LocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  lng?: number;
}

class AvailableRangeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  from: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  to: string;
}

export class CreateVehicleDto {
  @ApiProperty({ example: 'Toyota Prius 2019' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({ enum: ['car', 'bike'], example: 'car' })
  @IsEnum(['car', 'bike'])
  type: VehicleType;

  @ApiProperty({ example: 6.5 })
  @Transform(({ value }): number => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value as number;
  })
  @IsNumber()
  @Min(0)
  pricePerHour: number;

  @ApiProperty({ example: 45 })
  @Transform(({ value }): number => {
    if (typeof value === 'string') {
      return parseFloat(value);
    }
    return value as number;
  })
  @IsNumber()
  @Min(0)
  pricePerDay: number;

  @ApiProperty({
    example: '{"address":"Colombo 7, Sri Lanka","lat":6.9149,"lng":79.8615}',
  })
  @Transform(({ value }): ParsedLocation | string => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ParsedLocation;
      } catch {
        return value;
      }
    }
    return value as ParsedLocation;
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    example: '[{"from":"2025-09-22T09:00:00.000Z","to":"2025-09-26T17:00:00.000Z"}]',
  })
  @Transform(({ value }): ParsedAvailableRange[] | string => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as ParsedAvailableRange[];
      } catch {
        return value;
      }
    }
    return value as ParsedAvailableRange[];
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailableRangeDto)
  availableRanges: AvailableRangeDto[];

  @ApiProperty({ example: 'Clean hybrid, non-smoking, AC. Perfect for city driving.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  @IsOptional()
  images?: Express.Multer.File[];
}
