import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ENV } from '../config/env';
import {
    AccessTokenPayload,
    RefreshTokenPayload,
    UserRole,
} from '../domain/entities/user.entity';

// ============================================================
// TOKEN SERVICE — JWT Yaratish va Tekshirish
// ============================================================

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    refreshTokenJti: string;
    expiresAt: Date;         // Refresh token muddati (DB uchun)
}

export class TokenService {
    /**
     * Access Token yaratish (qisqa muddatli: 15 daqiqa)
     */
    generateAccessToken(userId: number, roleId: number, role: UserRole): string {
        const payload: AccessTokenPayload = { sub: userId, role, roleId };
        return jwt.sign(payload, ENV.JWT.ACCESS_SECRET, {
            expiresIn: ENV.JWT.ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        });
    }

    /**
     * Refresh Token yaratish (uzoq muddatli: 7 kun)
     * jti (JWT ID) — har bir token unikal, DB da tekshiriladi
     */
    generateRefreshToken(userId: number): {
        token: string;
        jti: string;
        expiresAt: Date;
    } {
        const jti = uuidv4();
        const payload: RefreshTokenPayload = { sub: userId, jti };
        const token = jwt.sign(payload, ENV.JWT.REFRESH_SECRET, {
            expiresIn: ENV.JWT.REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
        });

        // expiresAt ni hisoblash (DB ga saqlash uchun)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 kun

        return { token, jti, expiresAt };
    }

    /**
     * Access Token tekshirish va payload olish
     */
    verifyAccessToken(token: string): AccessTokenPayload {
        try {
            return jwt.verify(token, ENV.JWT.ACCESS_SECRET) as unknown as AccessTokenPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('ACCESS_TOKEN_EXPIRED');
            }
            throw new Error('ACCESS_TOKEN_INVALID');
        }
    }

    /**
     * Refresh Token tekshirish va payload olish
     */
    verifyRefreshToken(token: string): RefreshTokenPayload {
        try {
            return jwt.verify(token, ENV.JWT.REFRESH_SECRET) as unknown as RefreshTokenPayload;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('REFRESH_TOKEN_EXPIRED');
            }
            throw new Error('REFRESH_TOKEN_INVALID');
        }
    }

    /**
     * To'liq token juftligi yaratish (login va refresh uchun)
     */
    generateTokenPair(userId: number, roleId: number, role: UserRole): TokenPair {
        const accessToken = this.generateAccessToken(userId, roleId, role);
        const { token: refreshToken, jti, expiresAt } = this.generateRefreshToken(userId);
        return { accessToken, refreshToken, refreshTokenJti: jti, expiresAt };
    }
}
