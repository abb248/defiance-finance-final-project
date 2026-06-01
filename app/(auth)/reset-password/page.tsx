import PasswordResetForm from "@/components/PasswordResetForm";
import { createSessionClient } from "@/lib/supabase/server";

const ResetPassword = async () => {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="flex-center size-full max-sm:px-6">
      <PasswordResetForm canReset={Boolean(user)} />
    </section>
  );
};

export default ResetPassword;
