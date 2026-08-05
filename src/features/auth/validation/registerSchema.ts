import { object, string, ref } from "yup"

type Translate = (key: string) => string

export const registerSchema = (t: Translate) =>
  object({
    name: string()
      .trim()
      .required(t("nameRequired")),

    email: string()
      .trim()
      .email(t("invalidEmail"))
      .required(t("emailRequired")),

    password: string()
      .min(6, t("passwordMin"))
      .required(t("passwordRequired")),

    confirmPassword: string()
      .oneOf([ref("password")], t("passwordsDoNotMatch"))
      .required(t("confirmPasswordRequired")),
  })
