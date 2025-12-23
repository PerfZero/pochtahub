#!/usr/bin/env python
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

def get_message_status(uuid, login, api_key):
    ts = str(int(time.time()))
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
    uuid = '5268e566-c857-11f0-82b1-0242c0a86496'
    
    print(f'Проверка статуса сообщения {uuid}...')
    result = get_message_status(uuid, REDSMS_LOGIN, REDSMS_API_KEY)
    
    if result:
        print('\nСтатус сообщения:')
        print(result)
        
        if result.get('item'):
            status = result['item'].get('status')
            print(f'\nТекущий статус: {status}')
            
            if status == 'delivered':
                print('✓ Звонок доставлен')
            elif status == 'undelivered':
                print('✗ Звонок не доставлен')
            elif status == 'progress':
                print('⏳ Звонок в процессе доставки')
    else:
        print('Не удалось получить статус')






















