'use server';

import { z } from 'zod';
import { sql, db } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });
   
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    const amountInCents = amount*100;
    const date = new Date().toISOString().split('T')[0];

    try {
      const testr = await db.connect();
      await testr.sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `
      testr.release();
    } catch (error) {
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices')
};

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
// ...
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
  try {
    const testr = await db.connect();
    await testr.sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
  `;
    testr.release();
  } catch (error) {
      return {
        message: 'Database Error: Failed to Update Invoice.'
      }
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
};

export async function deleteInvoice(id: string) {

  try {
    const testr = await db.connect();
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    testr.release();
    revalidatePath('/dashboard/invoices');
    return { 
      message: 'Deleted Invoice.'
    };
  } catch (error) {
    return {
      message: 'Database Error: Failed to Update Invoice.'
    }
  }
};