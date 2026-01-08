'use server';

import { sendContact as sendContactAction } from '../contacts/actions';

export async function sendContact(formData: FormData) {
  return sendContactAction(formData);
}