"use client";

import { NextIntlClientProvider } from "next-intl";
import { Provider } from "react-redux";
import  store  from "@/redux/store";

export default function Providers({
  children,
  messages,
  locale
}: {
  children: React.ReactNode;
  messages: any;
  locale: string;
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Provider store={store}>
        {children}
      </Provider>
    </NextIntlClientProvider>
  );
}