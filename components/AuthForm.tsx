'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp } from '@/lib/actions/user.actions';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import CustomInput from './CustomInput';
import { authFormSchema } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from "lucide-react"
const AuthForm = ({ type }: { type: 'sign-in' | 'sign-up' }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address: '',
      state: '',
     postalCode: '',
     dateOfBirth: '',
     ssn: '',
    },
  });
// components/AuthForm.tsx içindeki onSubmit fonksiyonu

const onSubmit = async (data: z.infer<typeof formSchema>) => {
  setIsLoading(true);
  setFormError(null);

  try {
    if (type === 'sign-up') {
      // 1. Supabase kayıt fonksiyonumuzu çağırıyoruz
      const result = await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName!, // Formdan gelen veriler
        lastName: data.lastName!,
        address: data.address!,
        state: data.state!,
        postalCode: data.postalCode!,
        dateOfBirth: data.dateOfBirth!,
        ssn: data.ssn!,
      });

      // 2. Başarılı olursa kullanıcıyı duruma (state) kaydediyoruz
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.user) {
        setUser(result.user as any);
      } else {
        setFormError('Kayıt başarısız. Lütfen tekrar deneyin.');
      }
    }

    if (type === 'sign-in') {
      // 1. Supabase giriş fonksiyonumuzu çağırıyoruz
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      // 2. Başarılı giriş olursa ana sayfaya yönlendiriyoruz
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.user) {
        router.push('/');
      } else {
        setFormError('Giriş başarısız. Lütfen tekrar deneyin.');
      }
    }
  } catch (error) {
    console.log("Form gönderilirken hata:", error);
    setFormError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
  } finally {
    setIsLoading(false);
  }
};
 

  return (
    <section className="auth-form">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href="/" className="cursor-pointer flex items-center gap-1">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Defiance Finance logo"
          />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-green-700">
            Defiance Finance
          </h1>
        </Link>

        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-white">
            {user
              ? 'Hesabı Bağla'
              : type === 'sign-in'
              ? 'Giriş Yap'
              : 'Kayıt Ol'}
          </h1>

          <p className="text-16 font-normal text-gray-300">
            {user
              ? 'Başlamak için hesabınızı bağlayın'
              : 'Lütfen bilgilerinizi giriniz'}
          </p>
        </div>
      </header>

      {user ? (
        <div className="flex flex-col gap-4">
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, () => {
              setFormError('Lütfen formdaki hataları düzeltin.');
            })}
            className="space-y-8"
          >
            {type === 'sign-up' && (
              <div className="flex gap-4">
                <CustomInput
                  control={form.control}
                  name="firstName"
                  label="Ad"
                  placeholder="Örn: Dila"
                />
                <CustomInput
                  control={form.control}
                  name="lastName"
                  label="Soyad"
                  placeholder="Örn: Yılmaz"
                />
              </div>
            )}

            <CustomInput
              control={form.control}
              name="email"
              label="E-posta"
              placeholder="E-postanızı girin"
            />

            <CustomInput
              control={form.control}
              name="password"
              label="Şifre"
              placeholder="Şifrenizi girin"
            />
            {type === 'sign-up' && (
              <>
            <CustomInput
        control={form.control}
        name="address"
        label="Adres"
        placeholder="Adresinizi girin"
      />
            <CustomInput
              control={form.control}
              name="state"
              label="Şehir/Eyalet"
              placeholder="Örn: Ankara"
            />
        <CustomInput
          control={form.control}
          name="ssn"
          label="SSN"
          placeholder="Örn: 1234"
        />
        <CustomInput
          control={form.control}
          name="dateOfBirth"
          label="Doğum Tarihi"
          placeholder="YYYY-AA-GG"
        />
        <CustomInput
          control={form.control}
          name="postalCode"
          label="Posta Kodu"
          placeholder="Örn: 06540"
        />
              </>
            )}
        
           <Button
  type="submit"
  disabled={isLoading}
  className="bg-green-600 hover:bg-green-700 w-full"
>
  {isLoading ? (
    <>
      <Loader2 size={20} className="animate-spin" />
      {" "}Loading...
    </>
  ) : type === 'sign-in' ? (
    'Giriş Yap'
  ) : (
    'Kayıt Ol'
  )}
</Button>

            {formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : null}
          </form>
        </Form>
        
      )}
      <footer className="flex justify-center gap-1">
  <p className="text-14 font-normal text-gray-300">
    {type === 'sign-in'
      ? "Hesabın yok mu?"
      : "Zaten hesabın var mı?"}
  </p>

  <Link
    href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
    className="form-link"
  >
    {type === 'sign-in' ? 'Kayıt Ol' : 'Giriş Yap'}
  </Link>
</footer>
    </section>
  );
};

export default AuthForm;
