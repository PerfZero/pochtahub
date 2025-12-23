import requests
import json
import time
import random

NOTIFICORE_API_KEY = 'live_0pi2ZdK61Yq0HwcLhRfS'
NOTIFICORE_API_URL_V1 = 'https://api.notificore.ru/rest'
NOTIFICORE_API_URL_V2 = 'http://one-api.notificore.ru'

print('=== Тест V1 API ===')
headers_v1 = {
    'X-API-KEY': NOTIFICORE_API_KEY,
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json'
}
reference = f'sms_79991234567_{int(time.time())}_{random.randint(1000, 9999)}'
payload_v1 = {
    'destination': 'phone',
    'body': 'Тестовое сообщение',
    'msisdn': '79991234567',
    'originator': 'PochtaHub',
    'reference': reference
}
try:
    response = requests.post(f'{NOTIFICORE_API_URL_V1}/sms/create', json=payload_v1, headers=headers_v1, timeout=30)
    print(f'Статус: {response.status_code}')
    print(f'Ответ: {json.dumps(response.json(), ensure_ascii=False, indent=2)}')
except Exception as e:
    print(f'Ошибка V1: {e}')

print('\n=== Тест V2 API (авторизация) ===')
try:
    token_response = requests.post(
        f'{NOTIFICORE_API_URL_V2}/api/auth/login',
        json={'api_key': NOTIFICORE_API_KEY},
        timeout=30
    )
    print(f'Статус авторизации: {token_response.status_code}')
    print(f'Ответ авторизации: {json.dumps(token_response.json(), ensure_ascii=False, indent=2)}')
    
    if token_response.status_code == 200:
        token_data = token_response.json()
        bearer_token = token_data.get('bearer')
        if bearer_token:
            print(f'\nBearer token получен: {bearer_token[:20]}...')
            headers_v2 = {
                'Authorization': f'Bearer {bearer_token}',
                'Content-Type': 'application/json'
            }
            payload_v2 = {
                'destination': 'phone',
                'body': 'Тестовое сообщение',
                'msisdn': '79991234567'
            }
            response_v2 = requests.post(
                f'{NOTIFICORE_API_URL_V2}/api/sms/send',
                json=payload_v2,
                headers=headers_v2,
                timeout=30
            )
            print(f'\nСтатус отправки V2: {response_v2.status_code}')
            print(f'Ответ отправки V2: {json.dumps(response_v2.json(), ensure_ascii=False, indent=2)}')
except Exception as e:
    print(f'Ошибка V2: {e}')

