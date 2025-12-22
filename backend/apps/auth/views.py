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

User = get_user_model()

NOTIFICORE_API_KEY = "test_wbtaHxnHd5RlL8akZuCb"
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
        method = request.data.get('method', 'sms')
        
        if not phone:
            return Response({'error': 'Телефон обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not phone.startswith('+'):
            phone = '+' + phone

        code = ''.join(random.choices(string.digits, k=4))
        
        if method == 'telegram':
            telegram_sent = send_telegram_message(phone, code)
            if telegram_sent:
                cache.set(f'verify_code_{phone}', code, 300)
                return Response({
                    'success': True,
                    'message': 'Код отправлен в Telegram',
                    'telegram_sent': True
                })
            else:
                return Response({
                    'error': 'Не удалось отправить код через Telegram',
                    'telegram_available': True
                }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            phone_number = int(phone_clean)
            
            message_text = f'Ваш код подтверждения: {code}'
            
            headers = {
                'X-API-KEY': NOTIFICORE_API_KEY,
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json'
            }
            
            payload = {
                'destination': 'phone',
                'body': message_text,
                'msisdn': str(phone_number),
                'originator': 'PochtaHub'
            }
            
            try:
                try:
                    response = requests.post(
                        f'{NOTIFICORE_API_URL_V1}/sms/create',
                        json=payload,
                        headers=headers,
                        timeout=30,
                        verify=True
                    )
                except (requests.exceptions.ConnectionError, requests.exceptions.SSLError) as https_err:
                    token_response = requests.post(
                        f'{NOTIFICORE_API_URL_V2}/api/auth/login',
                        json={'api_key': NOTIFICORE_API_KEY},
                        timeout=30
                    )
                    if token_response.status_code == 200:
                        token_data = token_response.json()
                        bearer_token = token_data.get('bearer')
                        headers_v2 = {
                            'Authorization': f'Bearer {bearer_token}',
                            'Content-Type': 'application/json'
                        }
                        payload_v2 = {
                            'destination': 'phone',
                            'body': message_text,
                            'msisdn': str(phone_number)
                        }
                        response = requests.post(
                            f'{NOTIFICORE_API_URL_V2}/api/sms/send',
                            json=payload_v2,
                            headers=headers_v2,
                            timeout=30
                        )
                    else:
                        raise https_err
                response.raise_for_status()
                result = response.json()
                
                if result and (result.get('result') or not result.get('error')):
                    cache.set(f'verify_code_{phone}', code, 300)
                    return Response({'success': True, 'message': 'Код отправлен в SMS'})
                else:
                    error_msg = result.get('errorDescription') or result.get('error') or 'Ошибка отправки SMS'
                    telegram_sent = send_telegram_message(phone, code)
                    if telegram_sent:
                        cache.set(f'verify_code_{phone}', code, 300)
                        return Response({
                            'success': True, 
                            'message': 'Код отправлен в Telegram',
                            'telegram_sent': True
                        })
                    return Response({
                        'error': error_msg,
                        'telegram_available': True
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except requests.exceptions.ConnectionError as conn_err:
                telegram_sent = send_telegram_message(phone, code)
                if telegram_sent:
                    cache.set(f'verify_code_{phone}', code, 300)
                    return Response({
                        'success': True,
                        'message': 'Код отправлен в Telegram',
                        'telegram_sent': True
                    })
                return Response({
                    'error': f'Ошибка подключения к Notificore API: {str(conn_err)}',
                    'telegram_available': True
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except requests.exceptions.Timeout:
                telegram_sent = send_telegram_message(phone, code)
                if telegram_sent:
                    cache.set(f'verify_code_{phone}', code, 300)
                    return Response({
                        'success': True,
                        'message': 'Код отправлен в Telegram',
                        'telegram_sent': True
                    })
                return Response({
                    'error': 'Таймаут при подключении к Notificore API',
                    'telegram_available': True
                }, status=status.HTTP_504_GATEWAY_TIMEOUT)
            except requests.exceptions.RequestException as req_err:
                telegram_sent = send_telegram_message(phone, code)
                if telegram_sent:
                    cache.set(f'verify_code_{phone}', code, 300)
                    return Response({
                        'success': True,
                        'message': 'Код отправлен в Telegram',
                        'telegram_sent': True
                    })
                return Response({
                    'error': f'Ошибка запроса к Notificore API: {str(req_err)}',
                    'telegram_available': True
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except ValueError:
            return Response({'error': 'Неверный формат номера телефона'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            telegram_sent = send_telegram_message(phone, code)
            if telegram_sent:
                cache.set(f'verify_code_{phone}', code, 300)
                return Response({
                    'success': True,
                    'message': 'Код отправлен в Telegram',
                    'telegram_sent': True
                })
            return Response({
                'error': f'Ошибка отправки SMS: {str(e)}',
                'telegram_available': True
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

        stored_code = cache.get(f'verify_code_{phone}')
        
        if not stored_code:
            return Response({'error': 'Код истёк, запросите новый'}, status=status.HTTP_400_BAD_REQUEST)
        
        if stored_code != code:
            return Response({'error': 'Неверный код'}, status=status.HTTP_400_BAD_REQUEST)

        cache.set(f'verified_phone_{phone}', True, 600)
        cache.delete(f'verify_code_{phone}')
        
        try:
            user = User.objects.get(phone=phone)
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
        except User.DoesNotExist:
            return Response({'success': True, 'message': 'Телефон подтверждён', 'user_exists': False})


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
