// @ts-nocheck
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email    = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.log("Usage: npm run reset-password <email> <newpassword>")
    process.exit(1)
  }

  if (password.length < 8) {
    console.log("Password must be at least 8 characters")
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    console.log(`No user found with email: ${email}`)
    process.exit(1)
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { email },
    data:  { password: hashed }
  })

  console.log(`✅ Password reset for ${email}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())