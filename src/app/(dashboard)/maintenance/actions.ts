'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function setVehicleMaintenance(formData: FormData) {
  const vehicleId = formData.get('vehicleId') as string
  const isMaintenance = formData.get('isMaintenance') === 'true'

  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      status: isMaintenance ? 'MAINTENANCE' : 'AVAILABLE'
    }
  })

  revalidatePath('/maintenance')
  revalidatePath('/vehicles')
  revalidatePath('/trips')
  revalidatePath('/')
}
