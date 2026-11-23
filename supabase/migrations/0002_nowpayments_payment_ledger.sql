-- =======================================================
-- VOUCHT MIGRATION 0002 — atomic, idempotent NOWPayments IPN
-- =======================================================
-- Records each provider payment exactly once and updates the subscription
-- and profile in the same database transaction. The webhook calls the RPC
-- with the service_role client; browser roles cannot execute it.

CREATE TABLE IF NOT EXISTS public.nowpayments_payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('pro', 'elite')),
  order_id TEXT NOT NULL,
  price_amount NUMERIC(12, 2) NOT NULL CHECK (price_amount > 0),
  price_currency TEXT NOT NULL CHECK (price_currency = 'USD'),
  pay_currency TEXT NOT NULL,
  pay_amount NUMERIC(30, 18) NOT NULL CHECK (pay_amount > 0),
  actually_paid NUMERIC(30, 18) NOT NULL CHECK (actually_paid > 0),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nowpayments_payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.nowpayments_payments FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.process_nowpayments_payment(
  p_payment_id TEXT,
  p_user_id UUID,
  p_plan TEXT,
  p_order_id TEXT,
  p_price_amount NUMERIC,
  p_price_currency TEXT,
  p_pay_currency TEXT,
  p_pay_amount NUMERIC,
  p_actually_paid NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inserted_id BIGINT;
  v_existing public.nowpayments_payments%ROWTYPE;
  v_period_start TIMESTAMPTZ := now();
  v_period_end TIMESTAMPTZ := now() + INTERVAL '30 days';
  v_expected_price NUMERIC;
BEGIN
  IF p_payment_id IS NULL OR btrim(p_payment_id) = ''
     OR p_user_id IS NULL
     OR p_plan NOT IN ('pro', 'elite')
     OR p_order_id IS NULL OR btrim(p_order_id) = ''
     OR p_price_currency <> 'USD'
     OR p_pay_currency IS NULL OR btrim(p_pay_currency) = ''
     OR p_price_amount IS NULL OR p_pay_amount IS NULL
     OR p_actually_paid IS NULL
     OR p_pay_amount <= 0 OR p_actually_paid <= 0
     OR p_actually_paid < p_pay_amount - GREATEST(p_pay_amount * 0.00000001, 0.000000000001)
  THEN
    RAISE EXCEPTION 'Invalid NOWPayments payment details';
  END IF;

  v_expected_price := CASE p_plan WHEN 'pro' THEN 10 WHEN 'elite' THEN 29 ELSE NULL END;
  IF abs(p_price_amount - v_expected_price) > 0.01 THEN
    RAISE EXCEPTION 'NOWPayments fiat amount does not match selected plan';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'NOWPayments user does not exist';
  END IF;

  INSERT INTO public.nowpayments_payments (
    payment_id, user_id, plan, order_id, price_amount, price_currency,
    pay_currency, pay_amount, actually_paid
  ) VALUES (
    p_payment_id, p_user_id, p_plan, p_order_id, p_price_amount,
    p_price_currency, lower(p_pay_currency), p_pay_amount, p_actually_paid
  )
  ON CONFLICT (payment_id) DO NOTHING
  RETURNING id INTO v_inserted_id;

  IF v_inserted_id IS NULL THEN
    SELECT * INTO v_existing
      FROM public.nowpayments_payments
     WHERE payment_id = p_payment_id;

    IF v_existing.user_id <> p_user_id
       OR v_existing.plan <> p_plan
       OR v_existing.order_id <> p_order_id THEN
      RAISE EXCEPTION 'NOWPayments payment ID was already used for a different order';
    END IF;

    RETURN jsonb_build_object('success', TRUE, 'duplicate', TRUE);
  END IF;

  INSERT INTO public.subscriptions (
    user_id, plan, payment_provider, status, provider_subscription_id,
    current_period_start, current_period_end, amount, currency, updated_at
  ) VALUES (
    p_user_id, p_plan, 'nowpayments', 'active', p_payment_id,
    v_period_start, v_period_end, v_expected_price, 'USD', v_period_start
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan = EXCLUDED.plan,
    payment_provider = 'nowpayments',
    status = 'active',
    provider_subscription_id = EXCLUDED.provider_subscription_id,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    amount = EXCLUDED.amount,
    currency = 'USD',
    updated_at = EXCLUDED.updated_at;

  UPDATE public.profiles
     SET plan = p_plan,
         plan_expires_at = v_period_end
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Could not update Voucht profile after payment';
  END IF;

  INSERT INTO public.activity_log (
    user_id, action, description, metadata
  ) VALUES (
    p_user_id,
    'subscription_changed',
    CASE WHEN p_plan = 'elite' THEN 'Elite' ELSE 'Pro' END
      || ' unlocked with a crypto payment; access runs to '
      || to_char(v_period_end AT TIME ZONE 'UTC', 'YYYY-MM-DD') || '.',
    jsonb_build_object(
      'provider', 'nowpayments',
      'payment_id', p_payment_id,
      'pay_currency', lower(p_pay_currency),
      'actually_paid', p_actually_paid
    )
  );

  RETURN jsonb_build_object('success', TRUE, 'duplicate', FALSE);
END;
$$;

REVOKE ALL ON FUNCTION public.process_nowpayments_payment(
  TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, NUMERIC, NUMERIC
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_nowpayments_payment(
  TEXT, UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, NUMERIC, NUMERIC
) TO service_role;
