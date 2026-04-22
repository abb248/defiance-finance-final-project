import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod";

// Bu fonksiyon Tailwind sınıflarını güvenli bir şekilde birleştirmemizi sağlar
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Bizim dinamik form kurallarımız 
export const authFormSchema = (type: string) => z.object({
  // Kayıt sayfasındaysak Ad ve Soyad zorunlu, Giriş sayfasındaysak opsiyonel
  firstName: type === 'sign-in' ? z.string().optional() : z.string().min(3, { message: 'Ad en az 3 karakter olmalıdır.' }),
  lastName: type === 'sign-in' ? z.string().optional() : z.string().min(3, { message: 'Soyad en az 3 karakter olmalıdır.' }),
  
  // Her iki durumda da e-posta ve şifre kuralları aynı
  email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi girin." }),
  password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
});