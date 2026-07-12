'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createVehicle(formData: FormData) {
  const registration = formData.get('registration') as string
  const make = formData.get('make') as string
  const model = formData.get('model') as string
  const year = parseInt(formData.get('year') as string, 10)

  await prisma.vehicle.create({
    data: {
      registration,
      make,
      model,
      year,
    }
  })

  revalidatePath('/vehicles')
  revalidatePath('/')
}
