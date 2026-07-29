import { object, string, ref } from "yup";

export const registerSchema = object({
  name: string()
    .trim()
    .required("Name is required"),

  email: string()
    .trim()
    .email("Invalid email address")
    .required("Email is required"),

  password: string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),

  confirmPassword: string()
    .oneOf([ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});