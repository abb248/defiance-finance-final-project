import React from 'react'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import { Input } from './ui/input'
import { Control, FieldPath } from 'react-hook-form'
import { z } from 'zod'
import { authFormSchema } from '@/lib/utils'

const formSchema = authFormSchema('sign-up')
type FormValues = z.infer<typeof formSchema>

interface CustomInputProps {
  control: Control<FormValues>
  name: FieldPath<FormValues>
  label: string
  placeholder: string
}

const CustomInput = ({
  control,
  name,
  label,
  placeholder,
}: CustomInputProps) => {
  const inputType =
    name === 'password' ? 'password' : name === 'email' ? 'email' : name === 'dateOfBirth' ? 'date' : 'text';
  const inputMode =
    name === 'email'
      ? 'email'
      : name === 'ssn' || name === 'postalCode'
      ? 'numeric'
      : undefined;
  const autoComplete =
    name === 'email'
      ? 'email'
      : name === 'password'
      ? 'new-password'
      : name === 'firstName'
      ? 'given-name'
      : name === 'lastName'
      ? 'family-name'
      : name === 'postalCode'
      ? 'postal-code'
      : undefined;
  const today = new Date().toISOString().slice(0, 10);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="form-item">
          <FormLabel className="form-label">{label}</FormLabel>

          <div className="flex w-full flex-col">
            <FormControl>
              <Input
                placeholder={placeholder}
                className="input-class"
                type={inputType}
                inputMode={inputMode}
                autoComplete={autoComplete}
                maxLength={name === 'ssn' ? 4 : undefined}
                max={name === 'dateOfBirth' ? today : undefined}
                {...field}
              />
            </FormControl>

            <FormMessage className="form-message mt-2" />
          </div>
        </FormItem>
      )}
    />
  )
}

export default CustomInput
