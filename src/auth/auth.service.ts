import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable({})
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signin(dto: AuthDto) {
    // find user with email
    const user = await this.prismaService.user.findFirst({
      where: {
        email: dto.email,
      },
    });
    // if user not exist throw exception
    if (!user) {
      throw new ForbiddenException('Credential wrong');
    }

    // compare password
    const match = await argon.verify(user.password, dto.password);
    // if password not match throw exception
    if (!match) {
      throw new ForbiddenException('Credential wrong');
    }

    // return response
    return await this.signToken(user.id, user.email);
  }
  async signup(dto: AuthDto) {
    // generate password
    const hash = await argon.hash(dto.password);
    try {
      // save in db
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          password: hash,
        },
      });

      delete user.password;
      // return the saved user
      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code == 'P2002'
      ) {
        throw new ForbiddenException('Credential Taken.');
      }
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const data = {
      sub: userId,
      email,
    };

    const token = await this.jwtService.signAsync(data, {
      expiresIn: '15m',
      secret: this.configService.get('JWT_SECRET'),
    });

    return {
      access_token: token,
    };
  }
}
