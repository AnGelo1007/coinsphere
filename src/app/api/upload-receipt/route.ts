// This API route has been deprecated and is no longer in use.
// The receipt submission logic has been moved to the client-side component `src/components/trader-dashboard/receipts/submit-receipt-form.tsx`.
// It now directly uses the Firebase client SDKs for Storage and Realtime Database.
// This file is being updated to explicitly return a 410 Gone status to prevent any accidental use.

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated and no longer in use. Please use the client-side submission form.' },
    { status: 410 } // 410 Gone
  );
}
