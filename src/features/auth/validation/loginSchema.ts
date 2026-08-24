import { object, string } from "yup"

type Translate = (key: string) => string

export const loginSchema = (t: Translate) =>
  object({
    email: string()
      .email(t("invalidEmail"))
      .required(t("emailRequired")),
    password: string()
      .min(6, t("passwordMin"))
      .required(t("passwordRequired")),
  })
