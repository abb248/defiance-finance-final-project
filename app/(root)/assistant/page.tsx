import FinanceAssistantChat from "@/components/FinanceAssistantChat";
import HeaderBox from "@/components/HeaderBox";
import { getFinanceAssistantOverview } from "@/lib/actions/assistant.actions";
import { redirect } from "next/navigation";

const AssistantPage = async () => {
  const overview = await getFinanceAssistantOverview();

  if (!overview) {
    redirect("/sign-in");
  }

  return (
    <section className="flex min-h-screen w-full flex-col gap-8 overflow-y-auto bg-gray-25 p-8 xl:py-12">
      <HeaderBox
        title="Finance Assistant"
        subtext="Ask questions about your accounts, spending, and recent transactions."
      />

      <FinanceAssistantChat overview={overview} />
    </section>
  );
};

export default AssistantPage;
