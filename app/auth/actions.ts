"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

export async function demoLogin() {
  
  cookies().set("user_email", "demo@example.com", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  redirect("/dashboard")
}

export async function signUp(formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  
  const passwordHash = await bcrypt.hash(password, 12)

  //insert user
  const { data, error } = await supabase
    .from("users")
    .insert([{ email, password_hash: passwordHash }])
    .select()
    .single()

  if (error) {
    return { error: "User already exists or invalid data" }
  }

  // easy session cookie
  cookies().set("user_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  redirect("/dashboard")
}

export async function signIn(formData: FormData) {
  const supabase = createClient()

  const email = formData.get("email") as string
  const password = formData.get("password") as string

  //check user exists 
  const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single()

  if (error || !user) {
    return { error: "Invalid credentials" }
  }

  //verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash)

  if (!passwordMatch) {
    return { error: "Invalid credentials" }
  }

  
  cookies().set("user_email", email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })

  redirect("/dashboard")
}

export async function signOut() {
  cookies().delete("user_email")
  redirect("/auth/login")
}

export async function getCurrentUser() {
  const userEmail = cookies().get("user_email")?.value

  if (!userEmail) {
    return null
  }

  const supabase = createClient()
  const { data: user } = await supabase.from("users").select("*").eq("email", userEmail).single()

  return user
}
