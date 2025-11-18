# PochtaHub API

Backend API для системы доставки на Django REST Framework.

## Архитектура

### Модули

1. **Auth** - Регистрация и авторизация
   - Регистрация по email/телефону
   - Авторизация (JWT Access + Refresh токены)
   - Защита API через middleware

2. **Tariffs** - Управление тарифами
   - Хранение тарифов и коэффициентов
   - API для расчета стоимости отправки
   - Поддержка нескольких транспортных компаний

3. **Orders** - Управление заказами
   - Создание заказа с параметрами груза
   - Данные отправителя/получателя
   - Автоматический расчет стоимости
   - Выбор транспортной компании
   - Управление статусами: new, pending_payment, paid, in_delivery, completed, cancelled
   - История событий заказа (OrderEvents)

4. **Payment** - Заглушка оплаты
   - Имитация успешного ответа платежной системы
   - Обновление статуса заказа после оплаты

5. **Users** - Личный кабинет
   - Просмотр и редактирование профиля
   - Список заказов пользователя

## Установка

1. Создайте виртуальное окружение:
```bash
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

4. Настройте базу данных PostgreSQL в `.env`

5. Выполните миграции:
```bash
python manage.py migrate
```

6. Создайте суперпользователя:
```bash
python manage.py createsuperuser
```

7. Запустите сервер:
```bash
python manage.py runserver
```

## API Endpoints

### Авторизация
- `POST /api/auth/register/` - Регистрация
- `POST /api/auth/login/` - Вход
- `POST /api/auth/token/refresh/` - Обновление токена

### Пользователи
- `GET /api/users/profile/` - Получить профиль
- `PATCH /api/users/profile/` - Обновить профиль

### Тарифы
- `GET /api/tariffs/companies/` - Список транспортных компаний
- `POST /api/tariffs/calculate/` - Расчет стоимости доставки

### Заказы
- `GET /api/orders/` - Список заказов пользователя
- `POST /api/orders/` - Создать заказ
- `GET /api/orders/{id}/` - Детали заказа
- `PATCH /api/orders/{id}/` - Обновить статус заказа

### Оплата
- `POST /api/payment/create/` - Создать платеж (заглушка)
- `GET /api/payment/{id}/` - Статус платежа

## Документация API

После запуска сервера доступна Swagger документация:
- Swagger UI: http://localhost:8000/swagger/
- ReDoc: http://localhost:8000/redoc/

## База данных

### Основные модели:
- `User` - Пользователи
- `TransportCompany` - Транспортные компании
- `Tariff` - Тарифы доставки
- `Order` - Заказы
- `OrderEvent` - События заказов
- `Payment` - Платежи

## Разработка

### Структура проекта:
```
pochtahub/
├── apps/
│   ├── auth/          # Авторизация
│   ├── users/         # Пользователи
│   ├── tariffs/       # Тарифы
│   ├── orders/        # Заказы
│   └── payment/       # Оплата
├── config/            # Настройки Django
├── manage.py
└── requirements.txt
```

### Расширяемость

- Расчет ТК реализован через интерфейс `TariffCalculator`
- Возможность добавления API BoxBerry, KCE и других ТК через наследование или плагины
- Модульная архитектура позволяет легко добавлять новые функции

## Технологии

- Django 4.2.7
- Django REST Framework 3.14.0
- JWT Authentication (djangorestframework-simplejwt)
- PostgreSQL
- Swagger/OpenAPI (drf-yasg)
