import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';

export enum Role {
  CLIENT = 'client',
  OWNER = 'owner',
}

export class RegisterDto {
  @ApiProperty() @IsNotEmpty() name: string;

  @ApiProperty() @IsEmail() email: string;

  @ApiProperty() @MinLength(6) password: string;

  @ApiProperty({ enum: Role, default: Role.CLIENT })
  @IsEnum(Role)
  role: Role;
}
