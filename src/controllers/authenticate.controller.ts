import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UsePipes,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { ZodValidationPipe } from 'src/pipes/zod-validation.pipe';
import { PrismaService } from 'src/prisma/prisma.service';
import { z } from 'zod';

const authenticationControllerBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type AuthenticationControllerBodySchema = z.infer<
  typeof authenticationControllerBodySchema
>;

@Controller('/api/v1')
export class AuthenticationController {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  @Post('/session')
  @UsePipes(new ZodValidationPipe(authenticationControllerBodySchema))
  async handle(@Body() body: AuthenticationControllerBodySchema) {
    const { email, password } = body;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) throw new UnauthorizedException('User credentials do not match');

    const isPasswordValid = await compare(password, user.password);

    if (!isPasswordValid)
      throw new UnauthorizedException('User credentials do not match');

    const accessToken = this.jwt.sign({ sub: user.id });

    return { access_token: accessToken };
  }
}
