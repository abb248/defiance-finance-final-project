import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const namePattern = /^[^0-9<>/\\{}[\]|]+$/;
const cityPattern = /^[^0-9<>/\\{}[\]|]+$/;
const postalCodePattern = /^[A-Za-z0-9\s]{4,10}$/;
const ssnPattern = /^\d{4}$/;

const isValidDateOfBirth = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const earliest = new Date(Date.UTC(today.getUTCFullYear() - 120, today.getUTCMonth(), today.getUTCDate()));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date <= today &&
    date >= earliest
  );
};

export const authFormSchema = (type: 'sign-in' | 'sign-up') =>
  z.object({
    firstName:
      type === 'sign-up'
        ? z.string()
            .trim()
            .min(2, { message: 'First name must be at least 2 characters.' })
            .max(40, { message: 'First name must be shorter than 40 characters.' })
            .regex(namePattern, { message: 'First name can only contain letters, spaces, apostrophes, or dots.' })
        : z.string().optional(),

    lastName:
      type === 'sign-up'
        ? z.string()
            .trim()
            .min(2, { message: 'Last name must be at least 2 characters.' })
            .max(40, { message: 'Last name must be shorter than 40 characters.' })
            .regex(namePattern, { message: 'Last name can only contain letters, spaces, apostrophes, or dots.' })
        : z.string().optional(),

    address:
      type === 'sign-up'
        ? z.string()
            .trim()
            .min(8, { message: 'Address must be at least 8 characters.' })
            .max(120, { message: 'Address must be shorter than 120 characters.' })
        : z.string().optional(),

    state:
      type === 'sign-up'
        ? z.string()
            .trim()
            .min(2, { message: 'Please enter state or city information.' })
            .max(60, { message: 'State or city must be shorter than 60 characters.' })
            .regex(cityPattern, { message: 'State or city can only contain letters, spaces, apostrophes, or dots.' })
        : z.string().optional(),

    postalCode:
      type === 'sign-up'
        ? z.string()
            .trim()
            .regex(postalCodePattern, { message: 'Postal code must be 4 to 10 letters or numbers.' })
        : z.string().optional(),

    dateOfBirth:
      type === 'sign-up'
        ? z.string()
            .trim()
            .refine(isValidDateOfBirth, { message: 'Please enter a real birth date in YYYY-MM-DD format.' })
        : z.string().optional(),

    ssn:
      type === 'sign-up'
        ? z.string()
            .trim()
            .regex(ssnPattern, { message: 'SSN must be the last 4 digits.' })
        : z.string().optional(),

    email: z.string().trim().toLowerCase().email({ message: "Please enter a valid email address." }),

    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  })
  export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));
