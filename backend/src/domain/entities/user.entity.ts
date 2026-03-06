// ============================================================
// DOMAIN ENTITY: User
// Tashqi kutubxonalarga bog'liq emas — sof biznes ob'ekti
// ============================================================

export type UserRole = 'admin' | 'manager' | 'teacher' | 'student' | 'parent';

export interface User {
    id: number;
    roleId: number;
    roleName: UserRole;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    passwordHash: string;
    isActive: boolean;
    avatarUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

// Token entity (session ma'lumotlari)
export interface UserSession {
    id: number;
    userId: number;
    refreshToken: string;
    ipAddress: string | null;
    userAgent: string | null;
    expiresAt: Date;
    createdAt: Date;
}

// JWT tokenlar ichdagi payload
export interface AccessTokenPayload {
    sub: number;          // user.id
    role: UserRole;
    roleId: number;
    iat?: number;
    exp?: number;
}

export interface RefreshTokenPayload {
    sub: number;          // user.id
    jti: string;          // unique token id (uuid)
    iat?: number;
    exp?: number;
}
