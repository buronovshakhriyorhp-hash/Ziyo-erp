import { User, UserSession } from '../entities/user.entity';

// ============================================================
// DOMAIN INTERFACE: IUserRepository
// Dependency Inversion — service faqat bu interfeysi biladi
// ============================================================
export interface IUserRepository {
    findById(id: number): Promise<User | null>;
    findByPhone(phone: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(options?: {
        roleId?: number;
        isActive?: boolean;
        search?: string;
        limit?: number;
        offset?: number;
    }): Promise<{ data: User[]; total: number }>;
    create(data: {
        roleId: number;
        firstName: string;
        lastName: string;
        phone: string;
        passwordHash: string;
        email?: string | null;
        avatarUrl?: string | null;
    }): Promise<User>;
    update(
        id: number,
        data: Partial<{
            firstName: string;
            lastName: string;
            phone: string;
            email: string | null;
            avatarUrl: string | null;
            isActive: boolean;
            roleId: number;
        }>
    ): Promise<User | null>;
    softDelete(id: number): Promise<void>;
    existsByPhoneOrEmail(
        phone: string,
        email?: string | null,
        excludeId?: number
    ): Promise<{ phoneExists: boolean; emailExists: boolean }>;
}

// ============================================================
// DOMAIN INTERFACE: ISessionRepository
// ============================================================
export interface ISessionRepository {
    create(data: {
        userId: number;
        refreshToken: string;
        ipAddress: string | null;
        userAgent: string | null;
        expiresAt: Date;
    }): Promise<UserSession>;

    findByToken(refreshToken: string): Promise<UserSession | null>;
    deleteByToken(refreshToken: string): Promise<void>;
    deleteAllByUserId(userId: number): Promise<void>;
    deleteExpired(): Promise<void>;
}
