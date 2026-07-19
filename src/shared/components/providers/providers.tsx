"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { Provider } from "react-redux";
import store from "@/redux/store";

const onError = (error: Error) => {
  if ("code" in error && (error as any).code === "ENVIRONMENT_FALLBACK") return;
  console.error(error);
};

export default function Providers({
  children,
  messages,
  locale,
}: {
  children: React.ReactNode;
  messages: AbstractIntlMessages;
  locale: string;
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale} timeZone="Asia/Riyadh" onError={onError}>
      <Provider store={store}>
        {children}
      </Provider>
    </NextIntlClientProvider>
  );
}