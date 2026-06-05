/// <reference types="astro/client" />

type SessionUser = {
  id:    string
  email: string
  name:  string | null
}

declare namespace App {
  interface Locals {
    user: SessionUser
  }
}
