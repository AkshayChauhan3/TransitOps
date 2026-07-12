'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createDriver(formData: FormData) {
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const licenseNum = formData.get('licenseNum') as string

  await prisma.driver.create({
    data: {
      firstName,
      lastName,
      licenseNum,
    }
  })

  revalidatePath('/drivers')
}
