# 🔧 Fix: Automatic Profile Creation for New Users

## Проблема

Новые пользователи, зарегистрированные через Supabase Auth, **НЕ получают автоматически профиль** в таблице `salesai_profiles`. Это происходит потому что:

1. ❌ Отсутствует database trigger для автоматического создания профиля
2. ❌ Процесс зависит только от API callback, который может не сработать
3. ❌ При сбое API пользователь создается в `auth.users`, но НЕ в `salesai_profiles`

## Решение

Добавлен **database trigger** который автоматически создает профиль в `salesai_profiles` при создании нового пользователя в `auth.users`.

### Что делает trigger:

✅ **Автоматическое создание профиля** - каждый новый пользователь получает профиль
✅ **Извлечение метаданных** - использует данные из `user_metadata` (имя, компания, и т.д.)
✅ **Создание/поиск компании** - автоматически находит или создает компанию
✅ **Роль demo_user** - все новые пользователи получают роль `demo_user` по умолчанию
✅ **Защита от дублирования** - использует `ON CONFLICT` для предотвращения дубликатов
✅ **Обработка ошибок** - не блокирует создание пользователя при ошибке

## Инструкция по применению

### Шаг 1: Выполните migration в Supabase

Откройте **Supabase Dashboard → SQL Editor** и выполните файл:

```
supabase/migrations/20250125000000_auto_create_profile_trigger.sql
```

**Или** выполните обновленный setup скрипт:

```
infra/supabase/setup.sql
```

### Шаг 2: Проверьте, что trigger создан

Выполните в SQL Editor:

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Вы должны увидеть:
- `trigger_name`: `on_auth_user_created`
- `event_manipulation`: `INSERT`
- `event_object_table`: `users`
- `action_statement`: `EXECUTE FUNCTION public.handle_new_user()`

### Шаг 3: Протестируйте регистрацию

1. Создайте нового пользователя через форму регистрации
2. Проверьте таблицу `salesai_profiles`:

```sql
SELECT
  id,
  auth_id,
  email,
  first_name,
  last_name,
  role,
  company_id,
  created_at
FROM salesai_profiles
ORDER BY created_at DESC
LIMIT 5;
```

3. Новый профиль должен появиться **автоматически** с ролью `demo_user`

### Шаг 4: Исправьте существующих пользователей (опционально)

Если у вас есть пользователи в `auth.users` без профилей в `salesai_profiles`:

```sql
-- Найти пользователей без профилей
SELECT
  u.id as auth_id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN salesai_profiles p ON u.id = p.auth_id
WHERE p.id IS NULL;

-- Создать профили для существующих пользователей (выполните через функцию)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT u.*
    FROM auth.users u
    LEFT JOIN salesai_profiles p ON u.id = p.auth_id
    WHERE p.id IS NULL
  LOOP
    -- Вызвать функцию создания профиля
    PERFORM public.handle_new_user_manual(user_record);
  END LOOP;
END $$;
```

## Технические детали

### Функция `handle_new_user()`

```sql
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
  -- Извлечение данных из auth metadata
  user_email := NEW.email;
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(user_email, '@', 1)
  );
  -- ... и т.д.

  -- Создание/поиск компании
  -- Создание профиля с demo_user ролью
  -- Обработка ошибок

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Trigger на `auth.users`

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Безопасность

### RLS Policies (уже настроены)

Убедитесь, что следующие политики активны:

```sql
-- Пользователи могут создавать собственные профили
CREATE POLICY "Users can insert own profile"
  ON salesai_profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_id);

-- Пользователи могут видеть собственные профили
CREATE POLICY "Users can see own profile"
  ON salesai_profiles FOR SELECT
  USING (auth.uid() = auth_id);
```

### Permissions

Trigger работает с `SECURITY DEFINER`, что означает он выполняется с правами владельца функции (postgres), обходя RLS для создания профиля.

## Проверка работы

### 1. Проверка trigger
```sql
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 2. Проверка профилей
```sql
SELECT COUNT(*) as total_profiles FROM salesai_profiles;
SELECT COUNT(*) as total_auth_users FROM auth.users;
-- Числа должны совпадать
```

### 3. Тест создания пользователя
```sql
-- Создать тестового пользователя (используйте Supabase Auth API)
-- Сразу проверить наличие профиля:
SELECT * FROM salesai_profiles WHERE email = 'test@example.com';
```

## FAQ

**Q: Что если trigger уже существует?**
A: Скрипт использует `DROP TRIGGER IF EXISTS`, поэтому безопасно выполнять повторно.

**Q: Нужно ли удалять API callback?**
A: Нет, оставьте API как fallback. Trigger работает на уровне БД, а API на уровне приложения.

**Q: Как обработать существующих пользователей?**
A: Используйте скрипт из "Шаг 4" выше для создания профилей.

**Q: Влияет ли это на производительность?**
A: Нет, trigger выполняется асинхронно и не блокирует регистрацию пользователя.

## Поддержка

При возникновении проблем:

1. Проверьте логи Supabase Dashboard → Logs
2. Проверьте наличие trigger: `SELECT * FROM information_schema.triggers`
3. Проверьте permissions: `SELECT * FROM information_schema.role_table_grants WHERE table_name = 'salesai_profiles'`
