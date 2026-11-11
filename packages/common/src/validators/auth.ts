import z from "zod"

export const managerUsernameValidator = z
  .string()
  .min(4, "Username cannot be less than 4 characters")
  .max(254, "Username cannot exceed 254 characters")

export const usernameValidator = z
  .string()
  .min(4, "Username cannot be less than 4 characters")
  .max(20, "Username cannot exceed 20 characters")

export const inviteCodeValidator = z.string().length(6, "Invalid invite code")
