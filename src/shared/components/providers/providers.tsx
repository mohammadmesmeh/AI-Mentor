"use client";

import { NextIntlClientProvider } from "next-intl";
import type { AbstractIntlMessages } from "next-intl";
import { MotionConfig } from "framer-motion";
import { Provider } from "react-redux";
import store from "@/redux/store";
import { LocaleProvider } from "./LocaleProvider";
import { SessionRestorer } from "./SessionRestorer";

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
        <SessionRestorer />
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
      </Provider>
    </NextIntlClientProvider>
  );
}