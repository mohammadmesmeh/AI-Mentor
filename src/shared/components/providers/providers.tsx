"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { Provider } from "react-redux";
import store from "@/redux/store";
import { LocaleProvider } from "./LocaleProvider";

const onError = (error: Error) => {
  if ("code" in error && (error as Error & { code?: unknown }).code === "ENVIRONMENT_FALLBACK") return;
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
      <LocaleProvider />
      <Provider store={store}>
        {children}
      </Provider>
    </NextIntlClientProvider>
  );
}