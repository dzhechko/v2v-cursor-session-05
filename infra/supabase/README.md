# Supabase Setup для Sales AI Trainer

## ⚠️ КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Автоматическое создание профилей

**ПРОБЛЕМА ОБНАРУЖЕНА И ИСПРАВЛЕНА!** Новые пользователи НЕ получали автоматически профиль в `salesai_profiles` после регистрации.

### 🔧 Решение применено:
- ✅ Добавлен database trigger `on_auth_user_created` на таблицу `auth.users`
- ✅ Функция `handle_new_user()` автоматически создает профили для всех новых пользователей
- ✅ Все новые пользователи автоматически получают роль `demo_user`
- ✅ Защита от дублирования с `ON CONFLICT`

### 📖 Инструкция по применению исправления:
**См. файл [FIX_PROFILE_CREATION.md](./FIX_PROFILE_CREATION.md) для детальных инструкций!**

---

## 📝 Обзор

Этот документ содержит инструкции по настройке базы данных Supabase для проекта Sales AI Trainer с использованием префикса `salesai_` для всех таблиц, чтобы избежать конфликтов с существующими данными.

## 🗃️ Структура схемы

### Таблицы с префиксом `salesai_`:
- `salesai_companies` - Компании (мультитенантность)
- `salesai_profiles` - Профили пользователей  
- `salesai_api_keys` - API ключи пользователей (зашифрованные)
- `salesai_sessions` - Голосовые сессии тренировок
- `salesai_transcripts` - Расшифровки разговоров
- `salesai_analysis_results` - Результаты анализа AI
- `salesai_session_analytics` - Аналитика сессий
- `salesai_subscriptions` - Подписки пользователей
- `salesai_usage` - Использование минут
- `salesai_feedback` - Обратная связь
- `salesai_audit_logs` - Аудит логи

### Пользовательские типы:
- `salesai_user_role` - Роли пользователей
- `salesai_session_status` - Статусы сессий
- `salesai_subscription_status` - Статусы подписок

## 🚀 Инструкции по применению

### Шаг 1: Подготовка

1. Откройте ваш проект в [Supabase Dashboard](https://supabase.com/dashboard)
2. Перейдите в раздел "SQL Editor"

### Шаг 2: Применение схемы

1. **Создайте таблицы и типы:**
   ```sql
   -- Скопируйте и выполните содержимое файла schema.sql
   ```

2. **Примените Row Level Security политики:**
   ```sql
   -- Скопируйте и выполните содержимое файла policies.sql
   ```

### Шаг 3: Проверка

Выполните следующие запросы для проверки:

```sql
-- Проверьте созданные таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'salesai_%';

-- Проверьте созданные типы
SELECT typname FROM pg_type 
WHERE typname LIKE 'salesai_%';

-- Проверьте политики RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'salesai_%';
```

### Шаг 4: Настройка переменных окружения

1. Скопируйте URL проекта и API ключи из Settings > API
2. Обновите файл `.env` в корне проекта:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш-anon-key
SUPABASE_SERVICE_ROLE_KEY=ваш-service-role-key
```

## 🔧 Конфигурация API ключей

После создания пользователей, им нужно будет добавить свои API ключи:

### ElevenLabs API Key
```sql
INSERT INTO salesai_api_keys (profile_id, service, encrypted_key, key_hash, is_active)
VALUES (
  'profile-uuid',
  'elevenlabs', 
  'encrypted-api-key',
  'hash-of-key',
  true
);
```

### OpenAI API Key  
```sql
INSERT INTO salesai_api_keys (profile_id, service, encrypted_key, key_hash, is_active)
VALUES (
  'profile-uuid',
  'openai',
  'encrypted-api-key', 
  'hash-of-key',
  true
);
```

## 📊 Начальные данные (опционально)

### Создание тестовой компании:
```sql
INSERT INTO salesai_companies (name, domain, settings)
VALUES (
  'Test Company',
  'testcompany.com',
  '{}'
);
```

### Создание тестового пользователя:
```sql
INSERT INTO salesai_profiles (
  auth_id, 
  company_id, 
  email, 
  first_name, 
  last_name, 
  role
) VALUES (
  'auth-user-uuid',
  (SELECT id FROM salesai_companies WHERE name = 'Test Company'),
  'test@testcompany.com',
  'Test',
  'User',
  'user'
);
```

## 🔒 Безопасность

- Все таблицы защищены Row Level Security (RLS)
- Пользователи могут видеть только свои данные
- Администраторы видят данные своей компании
- Супер-администраторы имеют полный доступ
- API ключи хранятся в зашифрованном виде
- Реализована GDPR-совместимая функция удаления данных

## 🧪 Тестирование подключения

После настройки можно протестировать подключение:

```bash
cd frontend
npm run dev
```

Перейдите на `http://localhost:3000` и попробуйте создать сессию.

## 🆘 Устранение проблем

### Ошибки с политиками RLS:
- Убедитесь, что все политики применены
- Проверьте, что auth.uid() возвращает корректный UUID
- Убедитесь, что у пользователя есть запись в salesai_profiles

### Ошибки подключения:
- Проверьте правильность URL и ключей в .env
- Убедитесь, что сервис-роль ключ имеет необходимые права
- Проверьте настройки CORS в Supabase (если необходимо)

## 📋 RLS Policy Management (EN)

**IMPORTANT: Policy Ownership Model**

As of January 2025, RLS policies follow a single source of truth model to prevent duplicate policy errors and 406 conflicts:

### Single Source of Truth: `/infra/supabase/policies.sql`

- **✅ DO**: Use `policies.sql` for all RLS policy definitions
- **✅ DO**: Apply policies AFTER running setup/migration scripts
- **❌ DON'T**: Define policies in multiple files (setup.sql, migrations, etc.)

### File Responsibilities:

1. **`setup.sql`**: Schema, tables, indexes, triggers, functions, ENABLE RLS statements
2. **`policies.sql`**: ALL RLS policy definitions (idempotent with DROP IF EXISTS)
3. **Migration files**: Schema changes only, reference policies.sql for RLS

### Application Sequence:

```bash
# 1. Apply schema and setup
psql -f infra/supabase/setup.sql

# 2. Apply migrations (if any)
psql -f supabase/migrations/*.sql

# 3. Apply RLS policies (LAST)
psql -f infra/supabase/policies.sql
```

### Policy Architecture:

- **Profile-based**: All policies use `auth.uid()` joined with `salesai_profiles`
- **No JWT claims**: Eliminated `auth.jwt() ->> 'role'` patterns
- **Idempotent**: Every CREATE POLICY has corresponding DROP POLICY IF EXISTS
- **Comprehensive**: Covers all tables with appropriate role-based access

This model prevents policy conflicts and ensures consistent, maintainable RLS across environments.
