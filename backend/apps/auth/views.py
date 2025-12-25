from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, LoginSerializer
import requests
import random
import string
import json
import os
import logging
import time
import uuid

logger = logging.getLogger(__name__)

User = get_user_model()

NOTIFICORE_API_KEY = "live_0pi2ZdK61Yq0HwcLhRfS"
NOTIFICORE_API_URL_V1 = "https://api.notificore.ru/rest"
NOTIFICORE_API_URL_V2 = "http://one-api.notificore.ru"

TELEGRAM_GATEWAY_TOKEN = os.getenv('TELEGRAM_GATEWAY_TOKEN', 'AAEXLwAAdHj0Jv-fq4mKpbRYx_Amf6DhvRiK1Ui7jRn6Eg')
TELEGRAM_GATEWAY_URL = 'https://gatewayapi.telegram.org/sendVerificationMessage'


def send_telegram_message(phone, code):
    if not TELEGRAM_GATEWAY_TOKEN:
        return False
    
    try:
        phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        phone_e164 = f'+{phone_clean}' if not phone.startswith('+') else phone
        
        headers = {
            'Authorization': f'Bearer {TELEGRAM_GATEWAY_TOKEN}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'phone_number': phone_e164,
            'code': code
        }
        
        response = requests.post(
            TELEGRAM_GATEWAY_URL,
            json=payload,
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result.get('ok', False)
        
        return False
    except Exception:
        return False


class SendCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        method = request.data.get('method', 'telegram')
        
        if not phone:
            return Response({'error': 'Телефон обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not phone.startswith('+'):
            phone = '+' + phone

        code = ''.join(random.choices(string.digits, k=4))
        
        logger.info(f'Попытка отправить код для {phone}, метод: {method}')
        
        if method == 'telegram' or method == 'auto':
            telegram_sent = send_telegram_message(phone, code)
            if telegram_sent:
                cache.set(f'verify_code_{phone}', str(code), 300)
                logger.info(f'Код успешно отправлен в Telegram для {phone}')
                return Response({
                    'success': True,
                    'message': 'Код отправлен в Telegram',
                    'telegram_sent': True
                })
            else:
                logger.warning(f'Не удалось отправить код в Telegram для {phone}, пробуем SMS')
                if method == 'telegram':
                    return Response({
                        'error': 'Не удалось отправить код через Telegram',
                        'telegram_available': False,
                        'sms_available': True
                    }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            phone_number = int(phone_clean)
            
            message_text = f'Ваш код подтверждения: {code}\npochtahab.ru'
            
            headers = {
                'X-API-KEY': NOTIFICORE_API_KEY,
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            }
            
            reference = f'sms_{phone_number}_{int(time.time())}_{random.randint(1000, 9999)}'
            
            payload = {
                'destination': 'phone',
                'body': message_text,
                'msisdn': str(phone_number),
                'originator': 'PochtaHub',
                'reference': reference
            }
            
            try:
                logger.info(f'Отправка SMS через Notificore V1 API для {phone}')
                response = requests.post(
                    f'{NOTIFICORE_API_URL_V1}/sms/create',
                    json=payload,
                    headers=headers,
                    timeout=30,
                    verify=True
                )
                logger.info(f'Ответ V1 API: статус {response.status_code}, тело: {response.text[:200]}')
                
                if response is None:
                    raise requests.exceptions.RequestException('Не получен ответ от API')
                
                response.raise_for_status()
                result = response.json()
                logger.info(f'Результат API: {json.dumps(result, ensure_ascii=False)[:500]}')
                
                success = False
                if isinstance(result, dict):
                    result_data = result.get('result')
                    if isinstance(result_data, dict):
                        error_code = result_data.get('error')
                        if error_code == 0:
                            success = True
                        else:
                            logger.warning(f'API вернул ошибку: {result_data.get("errorDescription")}')
                    elif result.get('error') == 0:
                        success = True
                    elif 'error' in result and result.get('error') != 0:
                        success = False
                    elif 'status' in result:
                        success = result.get('status') in ['success', 'ok', 'sent']
                    else:
                        success = response.status_code == 200
                elif isinstance(result, list) and len(result) > 0:
                    first_item = result[0]
                    if isinstance(first_item, dict):
                        success = first_item.get('status') in ['success', 'ok', 'sent'] or first_item.get('error') == 0
                
                if success:
                    cache_key = f'verify_code_{phone}'
                    cache.set(cache_key, str(code), 300)
                    logger.info(f'SMS успешно отправлена для {phone}, код сохранен в кэш: {code} (тип: {type(code).__name__}), ключ: {cache_key}')
                    return Response({'success': True, 'message': 'Код отправлен в SMS'})
                else:
                    error_msg = 'Ошибка отправки SMS'
                    if isinstance(result, dict):
                        error_msg = result.get('errorDescription') or result.get('error') or result.get('message') or error_msg
                    elif isinstance(result, list) and len(result) > 0:
                        first_item = result[0]
                        if isinstance(first_item, dict):
                            error_msg = first_item.get('errorDescription') or first_item.get('error') or error_msg
                    
                    logger.warning(f'Ошибка отправки SMS для {phone}: {error_msg}')
                    return Response({
                        'error': error_msg,
                        'telegram_available': False,
                        'sms_available': False
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except requests.exceptions.ConnectionError as conn_err:
                logger.error(f'Ошибка подключения к Notificore API: {str(conn_err)}')
                return Response({
                    'error': f'Ошибка подключения к SMS API: {str(conn_err)}',
                    'telegram_available': False,
                    'sms_available': False
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except requests.exceptions.Timeout:
                logger.error('Таймаут при подключении к Notificore API')
                return Response({
                    'error': 'Таймаут при подключении к SMS API',
                    'telegram_available': False,
                    'sms_available': False
                }, status=status.HTTP_504_GATEWAY_TIMEOUT)
            except requests.exceptions.RequestException as req_err:
                logger.error(f'Ошибка запроса к Notificore API: {str(req_err)}')
                return Response({
                    'error': f'Ошибка запроса к SMS API: {str(req_err)}',
                    'telegram_available': False,
                    'sms_available': False
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except ValueError:
            return Response({'error': 'Неверный формат номера телефона'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f'Неожиданная ошибка при отправке SMS: {str(e)}')
            return Response({
                'error': f'Ошибка отправки SMS: {str(e)}',
                'telegram_available': False,
                'sms_available': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        code = request.data.get('code')

        if not phone or not code:
            return Response({'error': 'Телефон и код обязательны'}, status=status.HTTP_400_BAD_REQUEST)

        phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not phone.startswith('+'):
            phone = '+' + phone

        cache_key = f'verify_code_{phone}'
        stored_code = cache.get(cache_key)
        logger.info(f'Проверка кода для {phone}, ключ кэша: {cache_key}, найден код: {stored_code is not None}')
        
        if not stored_code:
            logger.warning(f'Код не найден в кэше для {phone}, ключ: {cache_key}')
            return Response({'error': 'Код истёк, запросите новый'}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_code_str = str(stored_code).strip()
        code_str = str(code).strip()
        logger.info(f'Сравнение кодов: сохраненный="{stored_code_str}" (тип: {type(stored_code).__name__}), полученный="{code_str}" (тип: {type(code).__name__})')
        
        if stored_code_str != code_str:
            logger.warning(f'Коды не совпадают: сохраненный="{stored_code_str}", полученный="{code_str}"')
            return Response({'error': 'Неверный код'}, status=status.HTTP_400_BAD_REQUEST)

        logger.info(f'Код успешно проверен для {phone}, удаляем из кэша')
        cache.set(f'verified_phone_{phone}', True, 600)
        cache.delete(f'verify_code_{phone}')
        
        try:
            logger.info(f'Поиск пользователя с телефоном {phone}')
            user = User.objects.get(phone=phone)
            logger.info(f'Пользователь найден: {user.id}, {user.username}')
        except User.DoesNotExist:
            logger.info(f'Пользователь с телефоном {phone} не найден, создаем нового пользователя')
            phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '')
            username = f"user_{phone_clean}_{uuid.uuid4().hex[:6]}"
            password = User.objects.make_random_password(length=12)
            user = User.objects.create_user(
                username=username,
                phone=phone,
                password=password
            )
            logger.info(f'Создан новый пользователь: {user.id}, {user.username}')
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Телефон подтверждён',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        phone = request.data.get('phone', '')
        phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not phone.startswith('+'):
            phone = '+' + phone

        if not cache.get(f'verified_phone_{phone}'):
            return Response(
                {'error': 'Сначала подтвердите телефон'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        cache.delete(f'verified_phone_{phone}')

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username = serializer.validated_data['username']
        password = serializer.validated_data['password']

        user = authenticate(username=username, password=password)
        if not user:
            return Response(
                {'error': 'Неверные учетные данные'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'phone': user.phone,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })
