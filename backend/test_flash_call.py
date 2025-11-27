#!/usr/bin/env python
import os
import sys
import hashlib
import requests
import time
from decouple import config

REDSMS_API_URL = 'https://cp.redsms.ru/api/message'
REDSMS_LOGIN = config('REDSMS_LOGIN', default='pochtahub')
REDSMS_API_KEY = config('REDSMS_API_KEY', default='qDZgHNGVceSlxzbDtmjcbcun')

def generate_secret(ts, api_key):
    if sys.platform == 'darwin':
        import subprocess
        result = subprocess.run(['md5', '-s', f'{ts}{api_key}'], capture_output=True, text=True)
        return result.stdout.strip().split()[-1]
    else:
        return hashlib.md5(f'{ts}{api_key}'.encode()).hexdigest()

def send_flash_call(phone, code, login, api_key):
    ts = str(time.time())
    secret = generate_secret(ts, api_key)
    
    headers = {
        'login': login,
        'ts': ts,
        'secret': secret,
        'Content-type': 'application/json'
    }
    
    data = {
        'route': 'fcall',
        'to': phone,
        'text': code
    }
    
    try:
        response = requests.post(REDSMS_API_URL, headers=headers, json=data, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Ошибка запроса: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print(f'Ответ сервера: {e.response.text}')
        return None

def get_message_status(uuid, login, api_key):
    ts = str(time.time())
    secret = generate_secret(ts, api_key)
    
    headers = {
        'login': login,
        'ts': ts,
        'secret': secret
    }
    
    url = f'{REDSMS_API_URL}/{uuid}'
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Ошибка запроса: {e}')
        if hasattr(e, 'response') and e.response is not None:
            print(f'Ответ сервера: {e.response.text}')
        return None

if __name__ == '__main__':
    login = REDSMS_LOGIN
    api_key = REDSMS_API_KEY
    
    if len(sys.argv) >= 4:
        login = sys.argv[1]
        api_key = sys.argv[2]
        phone = sys.argv[3]
        code = sys.argv[4] if len(sys.argv) > 4 else None
    elif len(sys.argv) >= 2:
        phone = sys.argv[1]
        code = sys.argv[2] if len(sys.argv) > 2 else None
    else:
        print('Использование: python test_flash_call.py [логин] [api_key] <номер_телефона> <4-значный_код>')
        print('Пример: python test_flash_call.py +79993332211 1234')
        print('Или: python test_flash_call.py pochtahub qDZgHNGVceSlxzbDtmjcbcun +79993332211 1234')
        sys.exit(1)
    
    if not login or not api_key:
        print('Ошибка: необходимо указать логин и API ключ')
        sys.exit(1)
    
    if not code:
        print('Ошибка: необходимо указать 4-значный код')
        sys.exit(1)
    
    if len(code) != 4 or not code.isdigit():
        print('Ошибка: код должен состоять из 4 цифр')
        sys.exit(1)
    
    print(f'Отправка Flash Call на номер {phone} с кодом {code}...')
    result = send_flash_call(phone, code, login, api_key)
    
    if result:
        print('\nРезультат отправки:')
        print(result)
        
        if result.get('success') and result.get('items'):
            uuid = result['items'][0].get('uuid')
            if uuid:
                print(f'\nUUID сообщения: {uuid}')
                print('Ожидание 5 секунд перед проверкой статуса...')
                time.sleep(5)
                
                status_result = get_message_status(uuid, login, api_key)
                if status_result:
                    print('\nСтатус сообщения:')
                    print(status_result)
    else:
        print('Не удалось отправить Flash Call')
        sys.exit(1)

