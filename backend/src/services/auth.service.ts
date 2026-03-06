import { IUserRepository, ISessionRepository } from '../domain/interfaces/repository.interface';
import { TokenService } from './token.service';
import { verifyPassword, hashPassword, validatePasswordStrength } from '../utils/password.util';
import { AppError } from '../utils/api-response.util';
import { UserRole } from '../domain/entities/user.entity';

// ============================================================
// AUTH SERVICE
// Mas'uliyat: Barcha autentifikatsiya biznes mantiqi
//   - Register (yangi foydalanuvchi qo'shish)
//   - Login (telefon + parol)
//   - Refresh Token Rotation
//   - Logout (bir qurilma / barcha qurilmalar)
//   - Change Password (parol almashtirish)
// ============================================================

// ──────────────────────────────────────────────────────────────
// DATA TRANSFER OBJECTS (DTO) — kiruvchi ma'lumotlar shakli
// ──────────────────────────────────────────────────────────────

export interface RegisterDto {
    roleId: number;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;           // oddiy parol — xizmat ichida hash qilinadi
    email?: string | null;
    avatarUrl?: string | null;
}

export interface LoginDto {
    phone: string;
    password: string;
}

export interface ChangePasswordDto {
    currentPassword: string;
    newPassword: string;
}

// Javob shakli — barcha autentifikatsiya metodlari qaytaradi
export interface AuthResponseDto {
    accessToken: string;
    refreshToken: string;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        role: string;
        phone: string;
        email: string | null;
        avatarUrl: string | null;
    };
}

// So'rov meta ma'lumotlari (sessiyaga yoziladi)
export interface RequestMeta {
    ipAddress: string | null;
    userAgent: string | null;
}

// ──────────────────────────────────────────────────────────────
// AUTH SERVICE SINFI
// ──────────────────────────────────────────────────────────────

export class AuthService {
    constructor(
        private readonly userRepo: IUserRepository,
        private readonly sessionRepo: ISessionRepository,
        private readonly tokenSvc: TokenService,
        private readonly auditService?: any // Optional loosely coupled audit for demo
    ) { }

    // ════════════════════════════════════════════════════════
    // REGISTER — Yangi foydalanuvchi ro'yxatdan o'tkazish
    // ════════════════════════════════════════════════════════

    /**
     * Yangi foydalanuvchi yaratish.
     *
     * 1. Telefon/email unikal ekanini tekshiradi
     * 2. Parol kuchliligini tekshiradi
     * 3. Parolni bcrypt bilan hash qiladi
     * 4. Bazaga saqlaydi
     * 5. Access + Refresh token juftligi qaytaradi
     *
     * ⚠️ Bu metodni faqat Admin yoki Manager chaqirishi kerak.
     *    Ochiq endpointda qo'yma!
     */
    async register(dto: RegisterDto, meta: RequestMeta): Promise<AuthResponseDto> {
        // 1. Telefon va email unikalligi
        const { phoneExists, emailExists } = await (this.userRepo as any).existsByPhoneOrEmail(
            dto.phone,
            dto.email
        );
        if (phoneExists) {
            throw new AppError('Bu telefon raqami allaqachon ro\'yxatda bor', 409, 'PHONE_ALREADY_EXISTS');
        }
        if (emailExists) {
            throw new AppError('Bu email allaqachon ro\'yxatda bor', 409, 'EMAIL_ALREADY_EXISTS');
        }

        // 2. Parol kuchliligi tekshiruvi
        const { valid, errors } = validatePasswordStrength(dto.password);
        if (!valid) {
            throw new AppError('Parol yetarlicha kuchli emas', 400, 'WEAK_PASSWORD', errors);
        }

        // 3. Parolni hash qilish (bcrypt, 12 rounds)
        const passwordHash = await hashPassword(dto.password);

        // 4. Foydalanuvchini bazaga saqlash
        const user = await (this.userRepo as any).create({
            roleId: dto.roleId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            passwordHash,
            email: dto.email ?? null,
            avatarUrl: dto.avatarUrl ?? null,
        });

        // 5. Token juftligi yaratish va sessiyani saqlash
        return this._createSessionAndTokens(user, meta);
    }

    // ════════════════════════════════════════════════════════
    // LOGIN — Telefon + parol bilan kirish
    // ════════════════════════════════════════════════════════

    /**
     * Foydalanuvchini tizimga kiritish.
     *
     * Xavfsizlik qoidalari:
     *  - "Telefon topilmadi" va "Parol noto'g'ri" uchun BIR XIL xabar
     *    (Account Enumeration hujumidan himoya)
     *  - Timing-safe bcrypt.compare (Timing Attack dan himoya)
     *  - Bloklangan hisob alohida xabar beradi
     */
    async login(dto: LoginDto, meta: RequestMeta): Promise<AuthResponseDto> {
        // 1. Telefon bo'yicha izlash
        const user = await this.userRepo.findByPhone(dto.phone);

        // ⚠️ Telefon topilmadi va noto'g'ri parol — BIR XIL xabar
        if (!user) {
            throw new AppError('Telefon yoki parol noto\'g\'ri', 401, 'INVALID_CREDENTIALS');
        }

        // 2. Hisob bloklanganligini tekshirish
        if (!user.isActive) {
            throw new AppError(
                'Hisobingiz bloklangan. Administrator bilan bog\'laning.',
                403,
                'ACCOUNT_DISABLED'
            );
        }

        // 3. Parolni timing-safe taqqoslash (bcrypt)
        const isPasswordValid = await verifyPassword(dto.password, user.passwordHash);
        if (!isPasswordValid) {
            // Xuddi shunday xabar — enumeration dan himoya
            throw new AppError('Telefon yoki parol noto\'g\'ri', 401, 'INVALID_CREDENTIALS');
        }

        // 4. Token yaratish va sessiyani saqlash
        const authData = await this._createSessionAndTokens(user, meta);

        // 5. Track demo logins explicitly in Audit Log (Phase 6)
        if (dto.phone === '+998901111111' || dto.phone === '+998902222222') {
            try {
                // If we don't have auditService injected perfectly, we fallback to direct DB query or log
                const { query } = require('../config/database');
                await query(
                    `INSERT INTO audit_logs (table_name, record_id, operation, old_data, new_data, changed_by, ip_address, user_agent)
                     VALUES ($1, $2, $3, NULL, $4, $5, $6, $7)`,
                    [
                        'users', user.id, 'DEMO_LOGIN',
                        JSON.stringify({ role: user.roleName, phone: dto.phone, event: 'Demo tizimga kirish' }),
                        user.id, meta.ipAddress, meta.userAgent
                    ]
                );
            } catch (err) {
                console.error('Demo audit error:', err);
            }
        }

        return authData;
    }

    // ════════════════════════════════════════════════════════
    // REFRESH — Token yangilash (Rotation + Reuse Detection)
    // ════════════════════════════════════════════════════════

    /**
     * Yangi access token olish.
     *
     * Refresh Token Rotation (RTR) strategiyasi:
     *  1. Eski tokenni kriptografik tekshirish (JWT verify)
     *  2. Eski tokenni DB dan topish (oʻchirilgan/muddati oʻtganmi?)
     *  3. Topilmasa → Token Reuse hujumi! → BARCHA sessiyalarni o'chirish
     *  4. Eski tokenni o'chirish
     *  5. YANGI juft yaratish va saqlash
     */
    async refresh(refreshToken: string, meta: RequestMeta): Promise<AuthResponseDto> {
        // 1. JWT imzosini va muddatini tekshirish
        let payload: { sub: number };
        try {
            payload = this.tokenSvc.verifyRefreshToken(refreshToken);
        } catch {
            throw new AppError(
                'Refresh token yaroqsiz yoki muddati o\'tgan',
                401,
                'INVALID_REFRESH_TOKEN'
            );
        }

        // 2. DB da tokenni topish
        const session = await this.sessionRepo.findByToken(refreshToken);
        if (!session) {
            // ⚠️ Token reuse hujumi — barcha sessiyalarni bekor qilish
            await this.sessionRepo.deleteAllByUserId(payload.sub);
            throw new AppError(
                'Xavfli faoliyat aniqlandi. Barcha qurilmalardan chiqildi.',
                401,
                'TOKEN_REUSE_DETECTED'
            );
        }

        // 3. Foydalanuvchini yuklab olish
        const user = await this.userRepo.findById(payload.sub);
        if (!user || !user.isActive) {
            throw new AppError(
                'Foydalanuvchi topilmadi yoki bloklangan',
                401,
                'USER_NOT_FOUND'
            );
        }

        // 4. Eski tokenni o'chirish (Rotation)
        await this.sessionRepo.deleteByToken(refreshToken);

        // 5. Yangi token juftligi yaratish
        return this._createSessionAndTokens(user, meta);
    }

    // ════════════════════════════════════════════════════════
    // LOGOUT — Sessiyani bekor qilish
    // ════════════════════════════════════════════════════════

    /**
     * Joriy qurilmadan chiqish (refresh tokenni o'chirish).
     */
    async logout(refreshToken: string): Promise<void> {
        await this.sessionRepo.deleteByToken(refreshToken);
    }

    /**
     * Barcha qurilmalardan chiqish.
     * Parol o'chirilganda yoki xavfsizlik hodisasida ishlatiladi.
     */
    async logoutAll(userId: number): Promise<void> {
        await this.sessionRepo.deleteAllByUserId(userId);
    }

    // ════════════════════════════════════════════════════════
    // CHANGE PASSWORD — Parolni almashtirish
    // ════════════════════════════════════════════════════════

    /**
     * Foydalanuvchi o'z parolini o'zgartiradi.
     *
     * 1. Joriy parolni tekshiradi (eski paroli bilishi shart)
     * 2. Yangi parol kuchliligini tekshiradi
     * 3. Yangi paroli joriy bilan farq qilishini tekshiradi
     * 4. Yangi paroli hash qiladi va yangilaydi
     * 5. Barcha sessiyalarni o'chiradi (boshqa qurilmalardan chiqaradi)
     */
    async changePassword(
        userId: number,
        dto: ChangePasswordDto
    ): Promise<void> {
        // 1. Foydalanuvchini topish
        const user = await this.userRepo.findById(userId);
        if (!user) {
            throw new AppError('Foydalanuvchi topilmadi', 404, 'USER_NOT_FOUND');
        }

        // 2. Joriy parolni tekshirish
        const isCurrentValid = await verifyPassword(dto.currentPassword, user.passwordHash);
        if (!isCurrentValid) {
            throw new AppError('Joriy parol noto\'g\'ri', 401, 'WRONG_CURRENT_PASSWORD');
        }

        // 3. Yangi parol joriy bilan bir xil bo'lmasligi kerak
        const isSamePassword = await verifyPassword(dto.newPassword, user.passwordHash);
        if (isSamePassword) {
            throw new AppError(
                'Yangi parol joriy parol bilan bir xil bo\'lmasligi kerak',
                400,
                'SAME_PASSWORD'
            );
        }

        // 4. Yangi parol kuchliligi
        const { valid, errors } = validatePasswordStrength(dto.newPassword);
        if (!valid) {
            throw new AppError('Yangi parol yetarlicha kuchli emas', 400, 'WEAK_PASSWORD', errors);
        }

        // 5. Hash va yangilash
        const newHash = await hashPassword(dto.newPassword);
        await (this.userRepo as any).updatePassword(userId, newHash);

        // 6. Barcha sessiyalarni o'chirish (xavfsizlik uchun)
        await this.sessionRepo.deleteAllByUserId(userId);
    }

    // ════════════════════════════════════════════════════════
    // PRIVATE YORDAMCHI METODLAR
    // ════════════════════════════════════════════════════════

    /**
     * Token juftligi yaratib, sessiyani DB ga saqlaydi va javob qaytaradi.
     * Bir necha metodda takrorlanmasligi uchun ajratildi.
     */
    private async _createSessionAndTokens(
        user: { id: number; roleId: number; roleName: UserRole; firstName: string; lastName: string; phone: string; email: string | null; avatarUrl: string | null },
        meta: RequestMeta
    ): Promise<AuthResponseDto> {
        // Token juftligini yaratish
        const tokens = this.tokenSvc.generateTokenPair(user.id, user.roleId, user.roleName);

        // Sessiyani DB ga saqlash
        await this.sessionRepo.create({
            userId: user.id,
            refreshToken: tokens.refreshToken,
            ipAddress: meta.ipAddress,
            userAgent: meta.userAgent,
            expiresAt: tokens.expiresAt,
        });

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.roleName,
                phone: user.phone,
                email: user.email,
                avatarUrl: user.avatarUrl,
            },
        };
    }
}
