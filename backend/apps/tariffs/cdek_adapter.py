import requests
import time
import logging
import json
import base64
from typing import Dict, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class CDEKError(Exception):
    pass


class CDEKAdapter:
    TEST_API_URL = 'https://api.edu.cdek.ru/v2'
    PROD_API_URL = 'https://api.cdek.ru/v2'
    max_retries = 1
    current_try = 0
    
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
    
    def _delete_token(self):
        self._token = None
        self._token_expires = 0
    
    def _get_headers(self) -> Dict:
        token = self._get_auth_token()
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        return headers
    
    def _make_request(self, method: str, url: str, params: Dict = None, data: Dict = None) -> requests.Response:
        headers = self._get_headers()
        request_url = f'{self.api_url}/{url}' if not url.startswith('http') else url
        
        if method == 'GET':
            r = requests.get(request_url, params=params, headers=headers, timeout=30)
        elif method == 'POST':
            r = requests.post(request_url, data=json.dumps(data) if data else None, params=params, headers=headers, timeout=30)
        elif method == 'DELETE':
            r = requests.delete(request_url, headers=headers, timeout=30)
        elif method == 'PATCH':
            r = requests.patch(request_url, data=json.dumps(data) if data else None, params=params, headers=headers, timeout=30)
        else:
            raise Exception(f'{method} is illegal method')
        
        if r.status_code == 401 or r.status_code == 500:
            logger.warning(f'Ошибка {r.status_code} при запросе к CDEK: {r.text}')
            if self.current_try >= self.max_retries:
                raise CDEKError(f'Ошибка {r.status_code} после {self.max_retries} попыток')
            self._delete_token()
            self.current_try += 1
            return self._make_request(method, url, params, data)
        
        self.current_try = 0
        return r
    
    def _get_city_code(self, city_name: str = None, city_fias: str = None, postal_code: str = None) -> Optional[int]:
        url = 'location/cities'
        params = {
            'country_codes': 'RU',
            'size': 1
        }
        
        if city_fias:
            params['fias_guid'] = city_fias
        if postal_code:
            params['postal_code'] = postal_code
        if city_name:
            params['city'] = city_name
        
        logger.info(f'Поиск кода города: city_name={city_name}, city_fias={city_fias}, postal_code={postal_code}')
        try:
            response = self._make_request('GET', url, params=params)
            if response.status_code == 200:
                cities = response.json()
                if cities and len(cities) > 0:
                    if city_fias:
                        for city in cities:
                            if city.get('fias_guid') == city_fias:
                                city_code = city.get('code')
                                logger.info(f'Найден код города по FIAS {city_fias}: {city_code}')
                                return city_code
                    city_code = cities[0].get('code')
                    logger.info(f'Найден код города: {city_code}')
                    return city_code
            logger.warning(f'Город не найден')
            return None
        except Exception as e:
            logger.error(f'Ошибка поиска города: {str(e)}')
            return None
    
    def calculate_price(self, from_city: str = None, to_city: str = None, weight: float = None,
                        from_fias: str = None, to_fias: str = None,
                        from_postal: str = None, to_postal: str = None,
                        length: Optional[float] = None, width: Optional[float] = None, 
                        height: Optional[float] = None, tariff_code: Optional[int] = None,
                        packages: Optional[List[Dict]] = None, declared_value: Optional[float] = None) -> List[Dict]:
        logger.info(f'Расчет стоимости CDEK: {from_city} -> {to_city}, вес: {weight}кг')
        
        from_code = self._get_city_code(city_name=from_city, city_fias=from_fias, postal_code=from_postal)
        to_code = self._get_city_code(city_name=to_city, city_fias=to_fias, postal_code=to_postal)
        
        if not from_code:
            raise Exception(f'Город отправления не найден')
        if not to_code:
            raise Exception(f'Город назначения не найден')
        
        if not packages:
            package_data = {
                'weight': int(weight * 1000),
                'length': int(length) if length else 10,
                'width': int(width) if width else 10,
                'height': int(height) if height else 10
            }
            # Добавляем объявленную стоимость в пакет, если указана
            if declared_value and declared_value > 0:
                package_data['declared_value'] = int(declared_value)
                logger.info(f'Добавлена объявленная стоимость в пакет: {declared_value} руб.')
            packages = [package_data]
        else:
            # Если packages уже есть, добавляем declared_value в первый пакет
            if declared_value and declared_value > 0 and len(packages) > 0:
                packages[0]['declared_value'] = int(declared_value)
                logger.info(f'Добавлена объявленная стоимость в существующий пакет: {declared_value} руб.')
        
        data = {
            'type': 1,
            'date': datetime.now().replace(microsecond=0).isoformat() + '+0400',
            'currency': 1,
            'lang': 'rus',
            'from_location': {
                'code': from_code
            },
            'to_location': {
                'code': to_code
            },
            'packages': packages
        }
        
        # Если есть declared_value, добавляем услугу страховки явно с параметром
        if declared_value and declared_value > 0:
            if 'services' not in data:
                data['services'] = []
            # Добавляем услугу страховки с объявленной стоимостью в параметре
            # CDEK требует передавать declared_value в параметре услуги
            data['services'].append({
                'code': 'INSURANCE',
                'parameter': str(int(declared_value))  # Объявленная стоимость в параметре
            })
            logger.info(f'Добавлена услуга страховки с объявленной стоимостью {declared_value} руб. в параметре')
        
        if tariff_code:
            data['tariff_code'] = tariff_code
            logger.info(f'Используется фильтр по тарифу: {tariff_code}')
            url = 'calculator/tariff'
        else:
            url = 'calculator/tarifflist'
        
        logger.info(f'Запрос расчета тарифов CDEK: {url}, данные: {data}')
        try:
            response = self._make_request('POST', url, data=data)
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
            logger.info(f'Получен результат расчета CDEK (полный ответ): {json.dumps(result, indent=2, ensure_ascii=False)}')
            
            options = []
            if isinstance(result, list):
                for tariff in result:
                    if 'tariff_codes' in tariff:
                        for tariff_code_item in tariff['tariff_codes']:
                            tariff_code_for_insurance = tariff_code_item.get('tariff_code')
                            insurance_cost = 0
                            
                            # Если есть declared_value, делаем дополнительный запрос для получения страховки
                            if declared_value and declared_value > 0 and tariff_code_for_insurance:
                                try:
                                    insurance_data = {
                                        'type': 1,
                                        'date': datetime.now().replace(microsecond=0).isoformat() + '+0400',
                                        'currency': 1,
                                        'lang': 'rus',
                                        'tariff_code': tariff_code_for_insurance,
                                        'from_location': {
                                            'code': from_code
                                        },
                                        'to_location': {
                                            'code': to_code
                                        },
                                        'packages': packages,
                                        'services': [{
                                            'code': 'INSURANCE',
                                            'parameter': str(int(declared_value))
                                        }]
                                    }
                                    
                                    insurance_response = self._make_request('POST', 'calculator/tariff', data=insurance_data)
                                    if insurance_response.status_code == 200:
                                        insurance_result = insurance_response.json()
                                        if 'services' in insurance_result and isinstance(insurance_result['services'], list):
                                            for service in insurance_result['services']:
                                                service_code = service.get('code', '').upper()
                                                if 'INSURANCE' in service_code or 'СТРАХ' in service.get('name', '').upper():
                                                    insurance_cost = float(service.get('sum', 0))
                                                    logger.info(f'Найдена страховка для тарифа {tariff_code_for_insurance}: {insurance_cost}')
                                                    break
                                except Exception as e:
                                    logger.warning(f'Ошибка получения страховки для тарифа {tariff_code_for_insurance}: {str(e)}')
                            
                            options.append({
                                'company_id': None,
                                'company_name': 'CDEK',
                                'company_code': 'cdek',
                                'price': float(tariff_code_item.get('delivery_sum', 0)),
                                'tariff_name': tariff_code_item.get('tariff_name', ''),
                                'tariff_code': tariff_code_for_insurance,
                                'delivery_time': tariff_code_item.get('period_max', 0),
                                'insurance_cost': insurance_cost
                            })
            elif 'tariff_codes' in result:
                # Ответ от calculator/tarifflist - нет массива services
                # Делаем отдельный запрос calculator/tariff для каждого тарифа с declared_value
                for tariff_code_item in result['tariff_codes']:
                    tariff_code_for_insurance = tariff_code_item.get('tariff_code')
                    insurance_cost = 0
                    
                    # Если есть declared_value, делаем дополнительный запрос для получения страховки
                    if declared_value and declared_value > 0 and tariff_code_for_insurance:
                        try:
                            # Делаем запрос calculator/tariff для конкретного тарифа
                            insurance_data = {
                                'type': 1,
                                'date': datetime.now().replace(microsecond=0).isoformat() + '+0400',
                                'currency': 1,
                                'lang': 'rus',
                                'tariff_code': tariff_code_for_insurance,
                                'from_location': {
                                    'code': from_code
                                },
                                'to_location': {
                                    'code': to_code
                                },
                                'packages': packages,
                                'services': [{
                                    'code': 'INSURANCE',
                                    'parameter': str(int(declared_value))
                                }]
                            }
                            
                            insurance_response = self._make_request('POST', 'calculator/tariff', data=insurance_data)
                            if insurance_response.status_code == 200:
                                insurance_result = insurance_response.json()
                                logger.info(f'Ответ calculator/tariff для страховки (тариф {tariff_code_for_insurance}): {json.dumps(insurance_result, indent=2, ensure_ascii=False)}')
                                
                                # Ищем страховку в массиве services
                                if 'services' in insurance_result and isinstance(insurance_result['services'], list):
                                    for service in insurance_result['services']:
                                        service_code = service.get('code', '').upper()
                                        if 'INSURANCE' in service_code or 'СТРАХ' in service.get('name', '').upper():
                                            insurance_cost = float(service.get('sum', 0))
                                            logger.info(f'Найдена страховка для тарифа {tariff_code_for_insurance}: code={service.get("code")}, sum={insurance_cost}')
                                            break
                        except Exception as e:
                            logger.warning(f'Ошибка получения страховки для тарифа {tariff_code_for_insurance}: {str(e)}')
                    
                    options.append({
                        'company_id': None,
                        'company_name': 'CDEK',
                        'company_code': 'cdek',
                        'price': float(tariff_code_item.get('delivery_sum', 0)),
                        'tariff_name': tariff_code_item.get('tariff_name', ''),
                        'tariff_code': tariff_code_for_insurance,
                        'delivery_time': tariff_code_item.get('period_max', 0),
                        'insurance_cost': insurance_cost
                    })
            elif 'total_sum' in result or 'delivery_sum' in result:
                # Ответ от calculator/tariff (с конкретным tariff_code) - есть массив services
                logger.info(f'Структура result (calculator/tariff): {json.dumps(result, indent=2, ensure_ascii=False)}')
                
                insurance_cost = 0
                # Ищем страховку в массиве services
                if 'services' in result and isinstance(result['services'], list):
                    for service in result['services']:
                        service_code = service.get('code', '').upper()
                        # CDEK может использовать разные коды для страховки
                        if 'INSURANCE' in service_code or 'СТРАХ' in service.get('name', '').upper():
                            insurance_cost = float(service.get('sum', 0))
                            logger.info(f'Найдена страховка: code={service.get("code")}, sum={insurance_cost}')
                            break
                
                delivery_sum = float(result.get('delivery_sum', result.get('total_sum', 0)))
                
                options.append({
                    'company_id': None,
                    'company_name': 'CDEK',
                    'company_code': 'cdek',
                    'price': delivery_sum,
                    'tariff_name': result.get('tariff_name', ''),
                    'tariff_code': result.get('tariff_code') or tariff_code,
                    'delivery_time': result.get('period_max', 0),
                    'insurance_cost': insurance_cost
                })
            
            return sorted(options, key=lambda x: x['price'])
        except Exception as e:
            raise Exception(f'Ошибка расчета стоимости CDEK: {str(e)}')
    
    def create_order(self, order_data: Dict, call_courier: bool = False, 
                    courier_date: str = None, courier_time_from: str = None, 
                    courier_time_to: str = None) -> Dict:
        url = 'orders'
        logger.info(f'Создание заказа в CDEK')
        logger.info(f'Данные заказа: {order_data}')
        
        try:
            response = self._make_request('POST', url, data=order_data)
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
            logger.info(f'Ответ создания заказа CDEK: {result}')
            
            if response.status_code == 202:
                if result.get('requests') and len(result['requests']) > 0:
                    if result['requests'][0].get('state') == 'ACCEPTED':
                        order_id = result.get('entity', {}).get('uuid')
                        logger.info(f'Заказ успешно создан в CDEK, UUID: {order_id}')
                        
                        if 'entity' in result and 'sender' in result['entity']:
                            sender_info = result['entity'].get('sender', {})
                            logger.info(f'Информация об отправителе в ответе CDEK: {sender_info}')
                        
                        if call_courier and order_id:
                            courier_result = self._call_courier(
                                order_id=order_id,
                                courier_date=courier_date,
                                courier_time_from=courier_time_from,
                                courier_time_to=courier_time_to
                            )
                            if courier_result:
                                result['courier_called'] = True
                            else:
                                result['courier_called'] = False
                                logger.warning('Не удалось вызвать курьера')
                        
                        return result
                    else:
                        raise Exception('Заказ не был принят CDEK')
                else:
                    raise Exception('Не получен ответ о статусе заказа')
            else:
                logger.info(f'Заказ успешно создан в CDEK: {result}')
                return result
        except Exception as e:
            logger.error(f'Ошибка создания заказа CDEK: {str(e)}')
            raise
    
    def _call_courier(self, order_id: str, courier_date: str = None, 
                     courier_time_from: str = None, courier_time_to: str = None) -> bool:
        url = 'intakes'
        data = {
            'order_uuid': order_id
        }
        
        if courier_date:
            data['intake_date'] = courier_date
        if courier_time_from:
            data['intake_time_from'] = courier_time_from
        if courier_time_to:
            data['intake_time_to'] = courier_time_to
        
        logger.info(f'Вызов курьера для заказа {order_id}')
        try:
            response = self._make_request('POST', url, data=data)
            logger.info(f'Ответ вызова курьера CDEK: статус {response.status_code}')
            
            if response.status_code == 202:
                return True
            elif response.status_code == 200:
                result = response.json()
                if result.get('requests') and len(result['requests']) > 0:
                    errors = result['requests'][0].get('errors', [])
                    if errors:
                        error_code = errors[0].get('code')
                        if error_code == 'v2_intake_exists_by_date_address':
                            logger.info('Курьер уже был вызван на этот адрес и дату')
                            return True
                    return True
                return True
            else:
                logger.warning(f'Ошибка вызова курьера: {response.text}')
                return False
        except Exception as e:
            logger.error(f'Ошибка вызова курьера: {str(e)}')
            return False
    
    def get_order_info(self, order_uuid: str = None, cdek_number: str = None) -> Dict:
        if cdek_number and not order_uuid:
            url = f'orders?cdek_number={cdek_number}'
        else:
            url = f'orders/{order_uuid}'
        
        logger.info(f'Получение информации о заказе CDEK: {url}')
        
        try:
            response = self._make_request('GET', url)
            logger.info(f'Ответ получения заказа CDEK: статус {response.status_code}')
            
            if response.status_code != 200:
                raise Exception(f'Ошибка получения заказа (код {response.status_code}): {response.text}')
            
            result = response.json()
            logger.info(f'Полная информация о заказе CDEK получена')
            
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
    
    def get_cdek_number(self, order_uuid: str) -> Optional[str]:
        try:
            order_info = self.get_order_info(order_uuid=order_uuid)
            if 'entity' in order_info:
                cdek_number = order_info['entity'].get('cdek_number')
                if cdek_number:
                    return cdek_number
            return None
        except:
            return None
    
    def get_delivery_points(self, city_code: Optional[int] = None, city: Optional[str] = None, 
                           postal_code: Optional[str] = None, type: str = 'PVZ', 
                           size: int = 50, fias_guid: Optional[str] = None,
                           weight_max: Optional[float] = None, is_handout: bool = True,
                           allowed_cod: Optional[bool] = None) -> List[Dict]:
        url = 'deliverypoints'
        params = {
            'type': type,
            'country_codes': 'RU',
            'size': size
        }
        
        if city_code:
            params['city_code'] = city_code
        elif city:
            params['city'] = city
        if postal_code:
            params['postal_code'] = postal_code
        if fias_guid:
            params['fias_guid'] = fias_guid
        if weight_max:
            params['weight_max'] = int(weight_max)
        if is_handout:
            params['is_handout'] = True
        if allowed_cod is not None:
            params['allowed_cod'] = 1 if allowed_cod else 0
        
        logger.info(f'Поиск ПВЗ CDEK: city_code={city_code}, city={city}, type={type}, size={size}')
        try:
            response = self._make_request('GET', url, params=params)
            logger.info(f'Ответ поиска ПВЗ CDEK: статус {response.status_code}')
            if response.status_code == 200:
                points = response.json()
                result = points if isinstance(points, list) else []
                logger.info(f'Найдено ПВЗ: {len(result)}')
                return result[:size]
            logger.warning(f'ПВЗ не найдены')
            return []
        except Exception as e:
            logger.error(f'Ошибка поиска ПВЗ CDEK: {str(e)}')
            return []
    
    def delete_order(self, order_uuid: str) -> Dict:
        url = f'orders/{order_uuid}'
        logger.info(f'Отмена заказа в CDEK: {url}')
        
        try:
            response = self._make_request('DELETE', url)
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
        except Exception as e:
            logger.error(f'Ошибка отмены заказа CDEK: {str(e)}')
            raise
    
    def get_documents(self, order_uuid: str = None, cdek_number: str = None, copy_count: int = 2) -> Dict:
        url = 'print/orders'
        
        if cdek_number and not order_uuid:
            data = {
                'orders': [{
                    'cdek_number': cdek_number
                }],
                'copy_count': copy_count
            }
        else:
            data = {
                'orders': [{
                    'order_uuid': order_uuid
                }],
                'copy_count': copy_count
            }
        
        logger.info(f'Запрос документов CDEK для заказа: {order_uuid or cdek_number}')
        
        try:
            response = self._make_request('POST', url, data=data)
            if response.status_code not in [200, 202]:
                raise Exception(f'Ошибка запроса документов (код {response.status_code}): {response.text}')
            
            result = response.json()
            
            if response.status_code == 202:
                if 'requests' in result and len(result['requests']) > 0:
                    request_state = result['requests'][0].get('state')
                    if request_state == 'ACCEPTED':
                        pdf_uuid = result.get('entity', {}).get('uuid')
                        if not pdf_uuid:
                            raise Exception('Не получен UUID документа из ответа 202')
                        logger.info(f'Запрос документов принят, UUID: {pdf_uuid}, ожидание готовности...')
                    else:
                        raise Exception(f'Запрос документов не принят, состояние: {request_state}')
                else:
                    raise Exception('Не получен ответ о статусе запроса документов')
            else:
                pdf_uuid = result.get('entity', {}).get('uuid')
                if not pdf_uuid:
                    raise Exception('Не получен UUID документа')
            
            pdf_url = self._get_document_url(pdf_uuid)
            
            if pdf_url:
                headers = self._get_headers()
                invoice_response = requests.get(pdf_url, headers=headers, timeout=30)
                if invoice_response.status_code == 200:
                    encoded_string = base64.b64encode(invoice_response.content).decode('utf-8')
                    return {
                        'success': True,
                        'base64': encoded_string,
                        'url': pdf_url
                    }
                else:
                    raise Exception(f'Ошибка получения документа по URL: {invoice_response.status_code}')
            else:
                raise Exception('Не получен URL документа')
        except Exception as e:
            logger.error(f'Ошибка получения документов CDEK: {str(e)}')
            return {'success': False, 'error': str(e)}
    
    def _get_document_url(self, pdf_uuid: str, max_attempts: int = 10) -> Optional[str]:
        url = f'print/orders/{pdf_uuid}'
        time.sleep(1)
        
        for attempt in range(1, max_attempts + 1):
            try:
                response = self._make_request('GET', url)
                if response.status_code == 200:
                    result = response.json()
                    pdf_url = result.get('entity', {}).get('url')
                    if pdf_url:
                        logger.info(f'URL документа получен на попытке {attempt}')
                        return pdf_url
                    else:
                        logger.info(f'Попытка {attempt}: документ еще обрабатывается')
                
                if attempt < max_attempts:
                    wait_time = min(2 * attempt, 5)
                    logger.info(f'Ожидание {wait_time} секунд перед следующей попыткой...')
                    time.sleep(wait_time)
            except Exception as e:
                logger.warning(f'Попытка {attempt} получения URL документа не удалась: {str(e)}')
                if attempt < max_attempts:
                    wait_time = min(2 * attempt, 5)
                    time.sleep(wait_time)
        
        logger.warning(f'Не удалось получить URL документа после {max_attempts} попыток')
        return None

