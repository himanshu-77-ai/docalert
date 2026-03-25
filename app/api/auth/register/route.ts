import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { sendWelcomeEmail } from "@/lib/email"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  workspaceName: z.string().min(1).max(100),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password, workspaceName } = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashedPassword,
        },
      })

      let slug = slugify(workspaceName)
      const existing = await tx.workspace.findUnique({ where: { slug } })
      if (existing) slug = `${slug}-${Date.now()}`

      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName,
          slug,
          members: {
            create: { userId: user.id, role: "ADMIN" },
          },
          notifSettings: { create: {} },
        },
      })

      return { user, workspace }
    })

    sendWelcomeEmail({ to: result.user.email!, name: result.user.name || "there" }).catch(console.error)

    return NextResponse.json({
      success: true,
      message: "Account created",
      userId: result.user.id,
    })
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    console.error("[Register]", err)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}
