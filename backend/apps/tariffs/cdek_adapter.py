import requests
import time
import logging
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)


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
            logger.debug('Использование существующего токена CDEK')
            return self._token
        
        url = f'{self.api_url}/oauth/token'
        logger.info(f'Запрос токена CDEK: {url}')
        data = {
            'grant_type': 'client_credentials',
            'client_id': self.account,
            'client_secret': self.secure_password
        }
        
        try:
            response = requests.post(url, data=data, timeout=10)
            logger.info(f'Ответ авторизации CDEK: статус {response.status_code}')
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
            logger.info('Токен CDEK успешно получен')
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
    
    def _get_city_code(self, city_name: str) -> Optional[int]:
        url = f'{self.api_url}/location/cities'
        params = {
            'city': city_name,
            'country_codes': 'RU',
            'size': 1
        }
        logger.info(f'Поиск кода города: {city_name}')
        try:
            response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
            logger.info(f'Ответ поиска города: статус {response.status_code}')
            if response.status_code == 200:
                cities = response.json()
                if cities and len(cities) > 0:
                    city_code = cities[0].get('code')
                    logger.info(f'Найден код города {city_name}: {city_code}')
                    return city_code
            logger.warning(f'Город {city_name} не найден')
            return None
        except Exception as e:
            logger.error(f'Ошибка поиска города {city_name}: {str(e)}')
            return None
    
    def calculate_price(self, from_city: str, to_city: str, weight: float, 
                        length: Optional[float] = None, width: Optional[float] = None, 
                        height: Optional[float] = None) -> List[Dict]:
        url = f'{self.api_url}/calculator/tarifflist'
        logger.info(f'Расчет стоимости CDEK: {from_city} -> {to_city}, вес: {weight}кг')
        
        from_code = self._get_city_code(from_city)
        to_code = self._get_city_code(to_city)
        
        if not from_code:
            raise Exception(f'Город отправления "{from_city}" не найден')
        if not to_code:
            raise Exception(f'Город назначения "{to_city}" не найден')
        
        packages = [{
            'weight': int(weight * 1000),
            'length': int(length) if length else 10,
            'width': int(width) if width else 10,
            'height': int(height) if height else 10
        }]
        
        data = {
            'from_location': {
                'code': from_code
            },
            'to_location': {
                'code': to_code
            },
            'packages': packages
        }
        
        logger.info(f'Запрос расчета тарифов CDEK: {url}, данные: {data}')
        try:
            response = requests.post(url, json=data, headers=self._get_headers(), timeout=10)
            logger.info(f'Ответ расчета тарифов CDEK: статус {response.status_code}')
            if response.status_code != 200:
                error_detail = response.text
                logger.error(f'Ошибка расчета CDEK (код {response.status_code}): {error_detail}')
                try:
                    error_json = response.json()
                    error_detail = error_json.get('error_description', error_json.get('error', error_detail))
                except:
                    pass
                raise Exception(f'Ошибка расчета CDEK (код {response.status_code}): {error_detail}')
            result = response.json()
            logger.info(f'Получен результат расчета: {len(result) if isinstance(result, list) else "объект"}')
            
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
        logger.info(f'Создание заказа в CDEK: {url}')
        logger.info(f'Данные заказа: {order_data}')
        
        try:
            response = requests.post(url, json=order_data, headers=self._get_headers(), timeout=30)
            logger.info(f'Ответ создания заказа CDEK: статус {response.status_code}')
            if response.status_code not in [200, 202]:
                error_detail = response.text
                logger.error(f'Ошибка создания заказа CDEK (код {response.status_code}): {error_detail}')
                try:
                    error_json = response.json()
                    error_detail = error_json.get('error_description', error_json.get('error', error_detail))
                except:
                    pass
                raise Exception(f'Ошибка создания заказа CDEK (код {response.status_code}): {error_detail}')
            result = response.json()
            logger.info(f'Заказ успешно создан в CDEK: {result}')
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f'Ошибка подключения при создании заказа CDEK: {str(e)}')
            raise Exception(f'Ошибка создания заказа CDEK: {str(e)}')
        except Exception as e:
            logger.error(f'Ошибка создания заказа CDEK: {str(e)}')
            raise
    
    def get_order_info(self, order_uuid: str) -> Dict:
        url = f'{self.api_url}/orders/{order_uuid}'
        logger.info(f'Получение информации о заказе CDEK: {url}')
        
        try:
            response = requests.get(url, headers=self._get_headers(), timeout=10)
            logger.info(f'Ответ получения заказа CDEK: статус {response.status_code}')
            response.raise_for_status()
            result = response.json()
            logger.info(f'Полная информация о заказе CDEK: {result}')
            
            if 'entity' in result:
                entity = result['entity']
                
                status = 'UNKNOWN'
                if 'statuses' in entity and len(entity['statuses']) > 0:
                    latest_status = entity['statuses'][-1]
                    status = latest_status.get('code', 'UNKNOWN')
                    status_name = latest_status.get('name', '')
                    logger.info(f'Последний статус заказа CDEK: {status} ({status_name})')
                
                cdek_number = entity.get('cdek_number', 'N/A')
                logger.info(f'Номер заказа CDEK: {cdek_number}')
                
                if 'requests' in result:
                    for req in result['requests']:
                        req_state = req.get('state')
                        req_errors = req.get('errors', [])
                        logger.info(f'Запрос: {req.get("type")}, состояние: {req_state}')
                        if req_errors:
                            for err in req_errors:
                                logger.warning(f'  Ошибка: {err.get("code")} - {err.get("message")}')
            
            return result
        except Exception as e:
            logger.error(f'Ошибка получения информации о заказе CDEK: {str(e)}')
            raise Exception(f'Ошибка получения информации о заказе CDEK: {str(e)}')
    
    def delete_order(self, order_uuid: str) -> Dict:
        url = f'{self.api_url}/orders/{order_uuid}'
        logger.info(f'Отмена заказа в CDEK: {url}')
        
        try:
            response = requests.delete(url, headers=self._get_headers(), timeout=10)
            logger.info(f'Ответ отмены заказа CDEK: статус {response.status_code}')
            if response.status_code not in [200, 202, 204]:
                error_detail = response.text
                logger.error(f'Ошибка отмены заказа CDEK (код {response.status_code}): {error_detail}')
                try:
                    error_json = response.json()
                    error_detail = error_json.get('error_description', error_json.get('error', error_detail))
                except:
                    pass
                raise Exception(f'Ошибка отмены заказа CDEK (код {response.status_code}): {error_detail}')
            if response.content:
                result = response.json()
                logger.info(f'Заказ успешно отменен в CDEK: {result}')
                return result
            else:
                logger.info('Заказ успешно отменен в CDEK')
                return {'status': 'deleted'}
        except requests.exceptions.RequestException as e:
            logger.error(f'Ошибка подключения при отмене заказа CDEK: {str(e)}')
            raise Exception(f'Ошибка отмены заказа CDEK: {str(e)}')
        except Exception as e:
            logger.error(f'Ошибка отмены заказа CDEK: {str(e)}')
            raise

