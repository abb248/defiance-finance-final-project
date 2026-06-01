import PasswordResetRequestForm from "@/components/PasswordResetRequestForm";

const ForgotPassword = ({
  searchParams,
}: {
  searchParams?: { error?: string };
}) => {
  return (
    <section className="flex-center size-full max-sm:px-6">
      <PasswordResetRequestForm initialError={searchParams?.error} />
    </section>
  );
};

export default ForgotPassword;
