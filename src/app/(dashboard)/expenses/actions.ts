'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logExpense(formData: FormData) {
  const type = formData.get('type') as string
  const amountStr = formData.get('amount') as string
  const description = formData.get('description') as string | null
  const vehicleId = formData.get('vehicleId') as string | null
  const tripId = formData.get('tripId') as string | null

  const amount = parseFloat(amountStr)
  if (isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount')
  }

  await prisma.expense.create({
    data: {
      type,
      amount,
      description: description || null,
      vehicleId: vehicleId || null,
      tripId: tripId || null,
    }
  })

  revalidatePath('/expenses')
  revalidatePath('/') // Revalidate dashboard KPIs
}
