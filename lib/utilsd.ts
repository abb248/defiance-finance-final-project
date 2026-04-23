import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const authFormSchema = (type: 'sign-in' | 'sign-up') =>
  z.object({
    firstName:
      type === 'sign-up'
        ? z.string().min(2, { message: 'Ad en az 2 karakter olmalıdır.' })
        : z.string().optional(),

    lastName:
      type === 'sign-up'
        ? z.string().min(2, { message: 'Soyad en az 2 karakter olmalıdır.' })
        : z.string().optional(),

    address:
      type === 'sign-up'
        ? z.string().min(5, { message: 'Adres en az 5 karakter olmalıdır.' })
        : z.string().optional(),

    state:
      type === 'sign-up'
        ? z.string().min(2, { message: 'Eyalet/şehir bilgisi giriniz.' })
        : z.string().optional(),

    postalCode:
      type === 'sign-up'
        ? z.string().min(4, { message: 'Posta kodu geçerli olmalıdır.' })
        : z.string().optional(),

    dateOfBirth:
      type === 'sign-up'
        ? z.string().min(8, { message: 'Doğum tarihi giriniz.' })
        : z.string().optional(),

    ssn:
      type === 'sign-up'
        ? z.string().min(4, { message: 'SSN bilgisi giriniz.' })
        : z.string().optional(),

    email: z.string().email({ message: "Lütfen geçerli bir e-posta adresi girin." }),

    password: z.string().min(8, { message: "Şifre en az 8 karakter olmalıdır." }),
  })