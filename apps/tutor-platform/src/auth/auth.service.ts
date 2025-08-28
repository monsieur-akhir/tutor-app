import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { User } from '../common/entities/user.entity';
import { UserSession } from '../common/entities/user-session.entity';
import { LoginDto, RegisterDto, RefreshTokenDto, TwoFactorDto } from './dto/auth.dto';
import { UserRole, UserStatus } from '../common/enums/user.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; message: string }> {
    const { email, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
      status: UserStatus.PENDING,
    });

    await this.userRepository.save(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, message: 'User registered successfully' };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string; refreshToken: string; user: Partial<User> }> {
    const { email, password } = loginDto;

    // Find user - Ne pas charger de relations pour éviter les erreurs
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'status', 'firstName', 'lastName', 'role', 'locale', 'isEmailVerified', 'isPhoneVerified', 'isTwoFactorEnabled', 'lastLoginAt', 'createdAt', 'updatedAt']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check user status
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Save session
    await this.saveSession(user.id, refreshToken);

    // Update last login
    await this.userRepository.update(user.id, { lastLoginAt: new Date() });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshTokenDto.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if session exists and is valid
      const session = await this.sessionRepository.findOne({
        where: { token: refreshTokenDto.refreshToken, isRevoked: false },
      });

      if (!session || session.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      // Update session
      await this.sessionRepository.update(session.id, {
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Revoke session
    await this.sessionRepository.update(
      { userId, token: refreshToken },
      { isRevoked: true }
    );
  }

  async enableTwoFactor(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `TutorPlatform:${user.email}`,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    // Save secret temporarily (user needs to verify it)
    await this.userRepository.update(userId, { twoFactorSecret: secret.base32 });

    return { qrCode, secret: secret.base32 };
  }

  async verifyTwoFactor(userId: string, twoFactorDto: TwoFactorDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication not set up');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorDto.code,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid two-factor code');
    }

    // Enable 2FA
    await this.userRepository.update(userId, { isTwoFactorEnabled: true });
  }

  async verifyTwoFactorCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
    });
  }

  private generateAccessToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  private async saveSession(userId: string, token: string): Promise<void> {
    const session = this.sessionRepository.create({
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await this.sessionRepository.save(session);
  }
}
