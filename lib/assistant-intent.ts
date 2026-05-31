export type AssistantQuestionIntent = {
  normalizedQuestion: string;
  isTurkish: boolean;
  asksAboutTransfer: boolean;
  asksAboutLatestTransfer: boolean;
  asksAboutTransferTotal: boolean;
  asksAboutCurrency: boolean;
};

export const includesAny = (value: string, terms: string[]) =>
  terms.some((term) => value.includes(term));

export const detectTurkishQuestion = (question: string) =>
  includesAny(question.toLowerCase(), [
    "bu ay",
    "butce",
    "harca",
    "hesap",
    "bakiye",
    "islem",
    "toplam",
    "transfer",
    "tl",
    "try",
    "tasarruf",
    "varsayilan",
    "alici",
  ]);

export const getAssistantQuestionIntent = (
  question: string
): AssistantQuestionIntent => {
  const normalizedQuestion = question.trim().toLowerCase();
  const asksAboutTransfer = includesAny(normalizedQuestion, [
    "transfer",
    "gonder",
    "gonderdim",
    "gonderd",
    "havale",
    "sent",
  ]);
  const asksAboutLatestTransfer =
    asksAboutTransfer &&
    includesAny(normalizedQuestion, [
      "son",
      "last",
      "latest",
      "recent",
      "islem",
      "hareket",
    ]);
  const asksAboutTransferTotal =
    asksAboutTransfer &&
    includesAny(normalizedQuestion, [
      "toplam",
      "total",
      "ne kadar",
      "harcad",
      "spent",
      "amount",
    ]);
  const asksAboutCurrency = includesAny(normalizedQuestion, [
    "tl",
    "try",
    "turkish lira",
    "turk lirasi",
    "para birimi",
    "currency",
  ]);

  return {
    normalizedQuestion,
    isTurkish: detectTurkishQuestion(normalizedQuestion),
    asksAboutTransfer,
    asksAboutLatestTransfer,
    asksAboutTransferTotal,
    asksAboutCurrency,
  };
};
