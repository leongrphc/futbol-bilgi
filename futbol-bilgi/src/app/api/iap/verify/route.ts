import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyIapGrant, IAP_PRODUCT_CONFIG, isIapProductId } from '@/lib/iap/products';
import { isIapPlatform, verifyPurchase, type IapPlatform } from '@/lib/iap/verification';

interface VerifyRequestBody {
  platform?: IapPlatform;
  productId?: string;
  transactionId?: string;
  receipt?: string;
  purchaseToken?: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as VerifyRequestBody;
  const { platform, productId, transactionId, receipt, purchaseToken } = body;

  if (!isIapPlatform(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  }

  if (!isIapProductId(productId)) {
    return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
  }

  if (platform === 'ios' && !receipt) {
    return NextResponse.json({ error: 'Receipt is required for iOS purchases' }, { status: 400 });
  }

  if (platform === 'android' && !purchaseToken) {
    return NextResponse.json({ error: 'Purchase token is required for Android purchases' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (transactionId) {
    const { data: existingTransaction, error: existingTransactionError } = await admin
      .from('iap_transactions')
      .select('*')
      .eq('platform', platform)
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existingTransactionError) {
      return NextResponse.json({ error: existingTransactionError.message }, { status: 500 });
    }

    if (existingTransaction?.status === 'verified' && existingTransaction.user_id === user.id) {
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

      return NextResponse.json({
        data: {
          profile,
          purchase: existingTransaction,
          idempotent: true,
        },
      });
    }
  }

  const verification = await verifyPurchase({
    platform,
    productId,
    transactionId,
    receipt,
    purchaseToken,
  });

  const { error: receiptError } = await admin
    .from('iap_receipts')
    .insert({
      user_id: user.id,
      platform,
      product_id: productId,
      transaction_id: verification.transactionId,
      purchase_token_hash: verification.purchaseTokenHash,
      receipt_hash: verification.receiptHash,
      validation_status: verification.status,
      validation_response: verification.rawResponse,
    });

  if (receiptError) {
    return NextResponse.json({ error: receiptError.message }, { status: 500 });
  }

  if (!verification.isValid) {
    const { error: rejectedTransactionError } = await admin
      .from('iap_transactions')
      .upsert({
        user_id: user.id,
        platform,
        product_id: productId,
        transaction_id: verification.transactionId,
        original_transaction_id: verification.originalTransactionId,
        purchase_token_hash: verification.purchaseTokenHash,
        receipt_hash: verification.receiptHash,
        status: verification.status,
        amount_cents: verification.amountCents,
        currency: verification.currency,
        provider_response: verification.rawResponse,
        verified_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'platform,transaction_id' });

    if (rejectedTransactionError) {
      return NextResponse.json({ error: rejectedTransactionError.message }, { status: 500 });
    }

    return NextResponse.json({ error: 'Purchase verification failed' }, { status: 400 });
  }

  const product = IAP_PRODUCT_CONFIG[productId];

  if (!product.repeatable) {
    const { data: existingVerified, error: existingVerifiedError } = await admin
      .from('iap_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', productId)
      .eq('status', 'verified')
      .maybeSingle();

    if (existingVerifiedError) {
      return NextResponse.json({ error: existingVerifiedError.message }, { status: 500 });
    }

    if (existingVerified) {
      return NextResponse.json({ error: `${product.label} already granted` }, { status: 400 });
    }
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const grant = applyIapGrant(profile, productId);

  const { data: updatedProfile, error: updateProfileError } = await admin
    .from('profiles')
    .update({
      coins: grant.coins,
      gems: grant.gems,
      is_premium: grant.is_premium,
      settings: grant.settings,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select('*')
    .single();

  if (updateProfileError) {
    return NextResponse.json({ error: updateProfileError.message }, { status: 500 });
  }

  const { data: savedTransaction, error: transactionError } = await admin
    .from('iap_transactions')
    .upsert({
      user_id: user.id,
      platform,
      product_id: productId,
      transaction_id: verification.transactionId,
      original_transaction_id: verification.originalTransactionId,
      purchase_token_hash: verification.purchaseTokenHash,
      receipt_hash: verification.receiptHash,
      status: 'verified',
      amount_cents: verification.amountCents,
      currency: verification.currency,
      provider_response: verification.rawResponse,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform,transaction_id' })
    .select('*')
    .single();

  if (transactionError) {
    return NextResponse.json({ error: transactionError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      profile: updatedProfile,
      purchase: grant.purchase,
      transaction: savedTransaction,
    },
  });
}
