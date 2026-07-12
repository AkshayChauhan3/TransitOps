'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTrip(formData: FormData) {
  const vehicleId = formData.get('vehicleId') as string
  const driverId = formData.get('driverId') as string
  const origin = formData.get('origin') as string
  const destination = formData.get('destination') as string

  // Note: Status defaults to DRAFT in Prisma Schema
  await prisma.trip.create({
    data: {
      vehicleId,
      driverId,
      origin,
      destination,
    }
  })

  revalidatePath('/trips')
}

export async function updateTripStatus(formData: FormData) {
  const tripId = formData.get('tripId') as string
  const status = formData.get('status') as 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

  // Update trip, vehicle, and driver in a transaction
  await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.update({
      where: { id: tripId },
      data: { status }
    })

    if (status === 'IN_PROGRESS') {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } })
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' } })
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } })
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } })
    }
  })

  revalidatePath('/trips')
  revalidatePath('/') // Dashboard
}
