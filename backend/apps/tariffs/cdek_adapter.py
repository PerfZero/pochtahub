import requests
import time
from typing import Dict, Optional, List


class CDEKAdapter:
    TEST_API_URL = 'https://api.edu.cdek.ru/v2'
    PROD_API_URL = 'https://api.cdek.ru/v2'
    
    def __init__(self, account: str, secure_password: str, test_mode: bool = True):
        self.account = account
        self.secure_password = secure_password
        self.api_url = self.TEST_API_URL if test_mode else self.PROD_API_URL
        self._token = None
        self._token_expires = 0
    
    def _get_auth_token(self) -> str:
        if self._token and time.time() < self._token_expires:
            return self._token
        
        url = f'{self.api_url}/oauth/token'
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.account,
            'client_secret': self.secure_password
        }
        
        try:
            response = requests.post(url, data=data, timeout=10)
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('error_description', error_json.get('error', error_detail))
                except:
                    pass
                raise Exception(f'Ошибка авторизации CDEK (код {response.status_code}): {error_detail}')
            token_data = response.json()
            if 'access_token' not in token_data:
                raise Exception('Токен не получен в ответе CDEK API')
            self._token = token_data['access_token']
            expires_in = token_data.get('expires_in', 3600)
            self._token_expires = time.time() + expires_in - 60
            return self._token
        except requests.exceptions.RequestException as e:
            raise Exception(f'Ошибка подключения к CDEK API: {str(e)}')
        except Exception as e:
            raise Exception(f'Ошибка получения токена CDEK: {str(e)}')
    
    def _get_headers(self) -> Dict:
        token = self._get_auth_token()
        return {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def calculate_price(self, from_city: str, to_city: str, weight: float, 
                        length: Optional[float] = None, width: Optional[float] = None, 
                        height: Optional[float] = None) -> List[Dict]:
        url = f'{self.api_url}/calculator/tarifflist'
        
        packages = [{
            'weight': int(weight * 1000),
            'length': int(length) if length else 10,
            'width': int(width) if width else 10,
            'height': int(height) if height else 10
        }]
        
        data = {
            'from_location': {
                'city': from_city
            },
            'to_location': {
                'city': to_city
            },
            'packages': packages
        }
        
        try:
            response = requests.post(url, json=data, headers=self._get_headers(), timeout=10)
            if response.status_code != 200:
                error_detail = response.text
                try:
                    error_json = response.json()
                    error_detail = error_json.get('error_description', error_json.get('error', error_detail))
                except:
                    pass
                raise Exception(f'Ошибка расчета CDEK (код {response.status_code}): {error_detail}')
            result = response.json()
            
            options = []
            if isinstance(result, list):
                for tariff in result:
                    if 'tariff_codes' in tariff:
                        for tariff_code in tariff['tariff_codes']:
                            options.append({
                                'company_id': None,
                                'company_name': 'CDEK',
                                'company_code': 'cdek',
                                'price': float(tariff_code.get('delivery_sum', 0)),
                                'tariff_name': tariff_code.get('tariff_name', ''),
                                'tariff_code': tariff_code.get('tariff_code'),
                                'delivery_time': tariff_code.get('period_min', 0)
                            })
            elif 'tariff_codes' in result:
                for tariff_code in result['tariff_codes']:
                    options.append({
                        'company_id': None,
                        'company_name': 'CDEK',
                        'company_code': 'cdek',
                        'price': float(tariff_code.get('delivery_sum', 0)),
                        'tariff_name': tariff_code.get('tariff_name', ''),
                        'tariff_code': tariff_code.get('tariff_code'),
                        'delivery_time': tariff_code.get('period_min', 0)
                    })
            
            return sorted(options, key=lambda x: x['price'])
        except Exception as e:
            raise Exception(f'Ошибка расчета стоимости CDEK: {str(e)}')
    
    def create_order(self, order_data: Dict) -> Dict:
        url = f'{self.api_url}/orders'
        
        try:
            response = requests.post(url, json=order_data, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f'Ошибка создания заказа CDEK: {str(e)}')
    
    def get_order_info(self, order_uuid: str) -> Dict:
        url = f'{self.api_url}/orders/{order_uuid}'
        
        try:
            response = requests.get(url, headers=self._get_headers())
            response.raise_for_status()
            return response.json()
        except Exception as e:
            raise Exception(f'Ошибка получения информации о заказе CDEK: {str(e)}')

