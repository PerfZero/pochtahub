#!/usr/bin/env python
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from apps.tariffs.cdek_adapter import CDEKAdapter

CDEK_ACCOUNT = 'ed8sFd9CZtQ8br0Jpxa7PRZW1MFxYqCJ'
CDEK_SECURE_PASSWORD = 'ASBMP16aasWq5Hpx57Hq6xsti05kZGsg'

def test_auth():
    print('=' * 60)
    print('Тест 1: Проверка авторизации')
    print('=' * 60)
    try:
        adapter = CDEKAdapter(
            account=CDEK_ACCOUNT,
            secure_password=CDEK_SECURE_PASSWORD,
            test_mode=False
        )
        token = adapter._get_auth_token()
        print(f'✓ Токен получен успешно: {token[:50]}...')
        return adapter
    except Exception as e:
        print(f'✗ Ошибка авторизации: {e}')
        return None

def test_calculate_price(adapter):
    print('\n' + '=' * 60)
    print('Тест 2: Расчет стоимости доставки')
    print('=' * 60)
    try:
        results = adapter.calculate_price(
            from_city='Москва',
            to_city='Санкт-Петербург',
            weight=1.0,
            length=15,
            width=20,
            height=10
        )
        print(f'✓ Получено тарифов: {len(results)}')
        for i, result in enumerate(results[:5], 1):
            print(f'\n  Тариф {i}:')
            print(f'    Название: {result.get("tariff_name", "N/A")}')
            print(f'    Код тарифа: {result.get("tariff_code", "N/A")}')
            print(f'    Цена: {result.get("price", 0)} руб.')
            print(f'    Срок доставки: {result.get("delivery_time", 0)} дн.')
        return True
    except Exception as e:
        print(f'✗ Ошибка расчета: {e}')
        return False

def test_get_cities(adapter):
    print('\n' + '=' * 60)
    print('Тест 3: Получение списка городов')
    print('=' * 60)
    try:
        import requests
        url = f'{adapter.api_url}/location/cities'
        headers = adapter._get_headers()
        params = {'country_codes': 'RU', 'size': 5}
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        if response.status_code == 200:
            cities = response.json()
            print(f'✓ Получено городов: {len(cities)}')
            for city in cities[:5]:
                print(f'  - {city.get("city", "N/A")} (код: {city.get("code", "N/A")})')
            return True
        else:
            print(f'✗ Ошибка получения городов (код {response.status_code}): {response.text}')
            return False
    except Exception as e:
        print(f'✗ Ошибка: {e}')
        return False

def test_webhook_subscription(adapter):
    print('\n' + '=' * 60)
    print('Тест 4: Проверка webhook подписок')
    print('=' * 60)
    try:
        import requests
        url = f'{adapter.api_url}/webhooks'
        headers = adapter._get_headers()
        
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            subscriptions = response.json()
            print(f'✓ Получено подписок: {len(subscriptions)}')
            for sub in subscriptions:
                print(f'  - Тип: {sub.get("type", "N/A")}, URL: {sub.get("url", "N/A")}')
            return True
        else:
            print(f'✗ Ошибка получения подписок (код {response.status_code}): {response.text}')
            return False
    except Exception as e:
        print(f'✗ Ошибка: {e}')
        return False

if __name__ == '__main__':
    print('\nПроверка CDEK API')
    print(f'Account: {CDEK_ACCOUNT}')
    print(f'Режим: PRODUCTION\n')
    
    adapter = test_auth()
    if not adapter:
        print('\n✗ Не удалось авторизоваться. Проверьте учетные данные.')
        sys.exit(1)
    
    results = []
    results.append(('Авторизация', True))
    results.append(('Расчет стоимости', test_calculate_price(adapter)))
    results.append(('Получение городов', test_get_cities(adapter)))
    results.append(('Webhook подписки', test_webhook_subscription(adapter)))
    
    print('\n' + '=' * 60)
    print('Итоги тестирования:')
    print('=' * 60)
    for test_name, success in results:
        status = '✓' if success else '✗'
        print(f'{status} {test_name}')
    
    all_passed = all(result[1] for result in results)
    if all_passed:
        print('\n✓ Все тесты пройдены успешно!')
    else:
        print('\n✗ Некоторые тесты не прошли')
        sys.exit(1)

