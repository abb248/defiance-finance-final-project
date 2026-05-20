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
        ? z.string().min(2, { message: 'First name must be at least 2 characters.' })
        : z.string().optional(),

    lastName:
      type === 'sign-up'
        ? z.string().min(2, { message: 'Last name must be at least 2 characters.' })
        : z.string().optional(),

    address:
      type === 'sign-up'
        ? z.string().min(5, { message: 'Address must be at least 5 characters.' })
        : z.string().optional(),

    state:
      type === 'sign-up'
        ? z.string().min(2, { message: 'Please enter state/city information.' })
        : z.string().optional(),

    postalCode:
      type === 'sign-up'
        ? z.string().min(4, { message: 'Postal code must be valid.' })
        : z.string().optional(),

    dateOfBirth:
      type === 'sign-up'
        ? z.string().min(8, { message: 'Please enter date of birth.' })
        : z.string().optional(),

    ssn:
      type === 'sign-up'
        ? z.string().min(4, { message: 'Please enter SSN information.' })
        : z.string().optional(),

    email: z.string().email({ message: "Please enter a valid email address." }),

    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  })
  export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));