# 🚨 СРОЧНОЕ ИСПРАВЛЕНИЕ: Trigger не работает

## Проблема
Trigger был применён через CLI, но **НЕ РАБОТАЕТ**. Пользователи создаются в `auth.users`, но профили НЕ появляются в `salesai_profiles`.

## 🔧 Экстренное решение (5 минут)

### Шаг 1: Диагностика (опционально)

Если хотите узнать что не так:

1. Откройте https://supabase.com/dashboard/project/shqniquajuhghcawtddw/sql/new
2. Скопируйте содержимое файла `DIAGNOSE_TRIGGER.sql`
3. Выполните его
4. Проверьте результаты

### Шаг 2: Применить исправление (ОБЯЗАТЕЛЬНО)

1. Откройте https://supabase.com/dashboard/project/shqniquajuhghcawtddw/sql/new

2. Скопируйте **ВЕСЬ** SQL из файла `FIX_TRIGGER_NOW.sql`

3. Вставьте в SQL Editor

4. Нажмите **"Run"** или **Ctrl+Enter**

5. Проверьте результат - вы должны увидеть:
   ```
   ✅ TRIGGER INSTALLED
   ✅ FUNCTION INSTALLED
   ⚠️ USERS WITHOUT PROFILES (список пользователей)
   ```

### Шаг 3: Создать профили для существующих пользователей

После применения исправления, создайте профили для уже зарегистрированных пользователей:

```sql
-- Создать профили для всех существующих пользователей без профилей
DO $$
DECLARE
  user_record RECORD;
  new_company_id UUID;
  user_company TEXT;
  user_domain TEXT;
BEGIN
  FOR user_record IN
    SELECT u.*
    FROM auth.users u
    LEFT JOIN salesai_profiles p ON u.id = p.auth_id
    WHERE p.id IS NULL
  LOOP
    -- Определить компанию
    user_company := COALESCE(
      user_record.raw_user_meta_data->>'company',
      user_record.raw_user_meta_data->>'company_name',
      'Personal Account'
    );
    user_domain := split_part(user_record.email, '@', 2);

    -- Найти или создать компанию
    SELECT id INTO new_company_id
    FROM salesai_companies
    WHERE name = user_company
    LIMIT 1;

    IF new_company_id IS NULL THEN
      INSERT INTO salesai_companies (name, domain, settings)
      VALUES (user_company, user_domain, '{}'::jsonb)
      RETURNING id INTO new_company_id;
    END IF;

    -- Создать профиль
    INSERT INTO salesai_profiles (
      auth_id,
      company_id,
      email,
      first_name,
      last_name,
      position,
      phone,
      team_size,
      role,
      demo_sessions_used,
      demo_minutes_used,
      settings
    )
    VALUES (
      user_record.id,
      new_company_id,
      LOWER(TRIM(user_record.email)),
      TRIM(COALESCE(
        user_record.raw_user_meta_data->>'first_name',
        user_record.raw_user_meta_data->>'full_name',
        split_part(user_record.email, '@', 1)
      )),
      TRIM(COALESCE(user_record.raw_user_meta_data->>'last_name', '')),
      COALESCE(user_record.raw_user_meta_data->>'position', NULL),
      COALESCE(user_record.raw_user_meta_data->>'phone', NULL),
      CASE
        WHEN user_record.raw_user_meta_data->>'team_size' IS NOT NULL
        THEN (user_record.raw_user_meta_data->>'team_size')::INTEGER
        ELSE NULL
      END,
      'demo_user',
      0,
      0,
      jsonb_build_object(
        'notifications', true,
        'email_summaries', true,
        'onboarding_completed', false
      )
    )
    ON CONFLICT (auth_id) DO NOTHING;

    RAISE NOTICE 'Created profile for: %', user_record.email;
  END LOOP;
END $$;

-- Проверить результат
SELECT
  'Profiles created!' as status,
  COUNT(*) as total_profiles
FROM salesai_profiles;

SELECT
  'Users without profiles (should be 0)' as status,
  COUNT(*) as orphaned_users
FROM auth.users u
LEFT JOIN salesai_profiles p ON u.id = p.auth_id
WHERE p.id IS NULL;
```

### Шаг 4: Тест

1. Зарегистрируйте нового тестового пользователя через UI
2. Выполните проверку:

```sql
-- Проверка последнего созданного профиля
SELECT
  email,
  first_name,
  last_name,
  role,
  demo_sessions_used,
  demo_minutes_used,
  created_at
FROM salesai_profiles
ORDER BY created_at DESC
LIMIT 1;
```

3. Профиль должен появиться **сразу** после регистрации!

## 🔍 Почему не сработало через CLI?

Возможные причины:
1. ❌ Миграция применилась, но функция создалась в неправильной схеме
2. ❌ Права доступа не были установлены корректно
3. ❌ Trigger создался, но не активировался
4. ❌ Функция имеет синтаксическую ошибку которая не видна в CLI

## ✅ Почему Dashboard работает лучше?

- ✅ Прямое выполнение SQL с немедленной обратной связью
- ✅ Видны все ошибки и warnings
- ✅ Можно сразу проверить результат
- ✅ Не зависит от локальной конфигурации CLI
- ✅ Работает с актуальной версией PostgreSQL в облаке

## 📊 После применения

Проверьте в Dashboard → Logs → Database, должны появиться NOTICE сообщения:
```
NOTICE: Trigger fired for user: test@example.com
NOTICE: Processing: email=test@example.com, first_name=Test, company=Test Company
NOTICE: Creating new company: Test Company
NOTICE: Created company with id: <uuid>
NOTICE: Creating profile for auth_id: <uuid>
NOTICE: Successfully created profile for: test@example.com
```

## 🆘 Если всё ещё не работает

1. Проверьте логи: Dashboard → Logs → Database
2. Ищите ошибки со словом "profile" или "trigger"
3. Убедитесь что таблица `salesai_profiles` имеет колонку `demo_sessions_used` и `demo_minutes_used`
4. Проверьте что enum тип `salesai_user_role` содержит значение `'demo_user'`

### Проверка enum типа:

```sql
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = 'salesai_user_role'::regtype
ORDER BY enumsortorder;
```

Должен содержать: `user`, `admin`, `super_admin`, `demo_user`

Если `demo_user` отсутствует:

```sql
ALTER TYPE salesai_user_role ADD VALUE IF NOT EXISTS 'demo_user';
```
