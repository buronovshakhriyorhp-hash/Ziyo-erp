import { IUserRepository } from '../domain/interfaces/repository.interface';
import { User } from '../domain/entities/user.entity';
import { AppError } from '../utils/api-response.util';
import bcrypt from 'bcryptjs';

export class UserService {
    constructor(private readonly userRepo: IUserRepository) { }

    /**
     * Barcha xodimlarni ro'yxatga olish (Pagination + Filter)
     */
    async findAll(options: {
        roleId?: number;
        isActive?: boolean;
        search?: string;
        page?: number;
        limit?: number;
    } = {}): Promise<{ data: any[]; pagination: any }> {
        const { page = 1, limit = 20, ...filters } = options;
        const offset = (page - 1) * limit;

        const { data, total } = await this.userRepo.findAll({
            ...filters,
            limit,
            offset,
        });

        // Xavfsizlik uchun parolni o'chirib tashlaymiz
        const sanitizedData = data.map((user: User) => {
            const { passwordHash, ...safeUser } = user;
            return safeUser;
        });

        return {
            data: sanitizedData,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            }
        };
    }

    /**
     * Foydalanuvchi ma'lumotlarini ID bo'yicha olish
     */
    async findById(id: number): Promise<Partial<User>> {
        const user = await this.userRepo.findById(id);
        if (!user) {
            throw new AppError('Foydalanuvchi topilmadi', 404, 'USER_NOT_FOUND');
        }

        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }

    /**
     * Profil ma'lumotlarini yangilash
     */
    async update(id: number, data: any): Promise<Partial<User>> {
        // Telefon yoki email unikal ekanini tekshirish
        if (data.phone || data.email) {
            const { phoneExists, emailExists } = await this.userRepo.existsByPhoneOrEmail(
                data.phone || '', // phone null bo'lishi mumkin emas
                data.email,
                id
            );

            if (data.phone && phoneExists) {
                throw new AppError('Ushbu telefon raqami band', 400, 'PHONE_ALREADY_EXISTS');
            }
            if (data.email && emailExists) {
                throw new AppError('Ushbu email manzili band', 400, 'EMAIL_ALREADY_EXISTS');
            }
        }

        // Parol o'zgarayotgan bo'lsa hash qilib saqlash
        if (data.password) {
            data.passwordHash = await bcrypt.hash(data.password, 12);
            delete data.password;
        }

        const updatedUser = await this.userRepo.update(id, data);
        if (!updatedUser) {
            throw new AppError('Yangilashda xato yuz berdi', 500);
        }

        const { passwordHash, ...safeUser } = updatedUser;
        return safeUser;
    }

    /**
     * Foydalanuvchini bloklash / deaktvatsiya qilish
     */
    async deactivate(id: number): Promise<void> {
        await this.userRepo.softDelete(id);
    }

    /**
     * Foydalanuvchini faollashtirish
     */
    async activate(id: number): Promise<void> {
        await this.userRepo.update(id, { isActive: true });
    }
}
