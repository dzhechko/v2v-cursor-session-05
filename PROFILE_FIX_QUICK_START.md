# 🚨 СРОЧНО: Исправление создания профилей пользователей

## Проблема
Новые пользователи **НЕ получают профиль** в `salesai_profiles` после регистрации!

## Быстрое решение (3 минуты)

### Шаг 1: Примените SQL в Supabase Dashboard

1. Откройте **Supabase Dashboard → SQL Editor**
2. Выполните этот SQL:

```sql
-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_company_id UUID;
  user_email TEXT;
  user_first_name TEXT;
  user_last_name TEXT;
  user_company_name TEXT;
  extracted_domain TEXT;
BEGIN
  user_email := NEW.email;
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    split_part(user_email, '@', 1)
  );
  user_last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    ''
  );
  user_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company',
    'Personal Account'
  );
  extracted_domain := split_part(user_email, '@', 2);

  SELECT id INTO default_company_id
  FROM public.salesai_companies
  WHERE name = user_company_name
  LIMIT 1;

  IF default_company_id IS NULL THEN
    INSERT INTO public.salesai_companies (name, domain, settings)
    VALUES (user_company_name, extracted_domain, '{}'::jsonb)
    RETURNING id INTO default_company_id;
  END IF;

  INSERT INTO public.salesai_profiles (
    auth_id, company_id, email, first_name, last_name,
    position, phone, team_size, role,
    demo_sessions_used, demo_minutes_used, settings
  )
  VALUES (
    NEW.id, default_company_id, LOWER(TRIM(user_email)),
    TRIM(user_first_name), TRIM(user_last_name),
    COALESCE(NEW.raw_user_meta_data->>'position', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    CASE WHEN NEW.raw_user_meta_data->>'team_size' IS NOT NULL
      THEN (NEW.raw_user_meta_data->>'team_size')::INTEGER
      ELSE NULL END,
    'demo_user', 0, 0,
    jsonb_build_object('notifications', true, 'email_summaries', true, 'onboarding_completed', false)
  )
  ON CONFLICT (auth_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_companies TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.salesai_profiles TO postgres, anon, authenticated, service_role;
```

### Шаг 2: Проверьте установку

Выполните:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Должен вернуть:
```
trigger_name         | event_object_table
---------------------|-------------------
on_auth_user_created | users
```

### Шаг 3: Протестируйте

1. Зарегистрируйте нового пользователя
2. Проверьте профиль:
```sql
SELECT email, first_name, last_name, role
FROM salesai_profiles
ORDER BY created_at DESC
LIMIT 1;
```

✅ Профиль должен появиться автоматически с ролью `demo_user`!

## Что это исправляет?

- ✅ Каждый новый пользователь **автоматически** получает профиль
- ✅ Профили создаются **на уровне БД** (надежнее API)
- ✅ Роль `demo_user` назначается **автоматически**
- ✅ Защита от дубликатов

## Детальная документация

См. `infra/supabase/FIX_PROFILE_CREATION.md` для полной инструкции и диагностики.

## Migration файл

Также доступен готовый migration:
```
supabase/migrations/20250125000000_auto_create_profile_trigger.sql
```
