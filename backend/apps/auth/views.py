from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, LoginSerializer
import notificore_restapi as notificore_api
import random
import string
import ssl
import requests

User = get_user_model()

NOTIFICORE_API_KEY = "test_wbtaHxnHd5RlL8akZuCb"


class SendCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = request.data.get('phone')
        if not phone:
            return Response({'error': 'Телефон обязателен'}, status=status.HTTP_400_BAD_REQUEST)

        phone = phone.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        if not phone.startswith('+'):
            phone = '+' + phone

        code = ''.join(random.choices(string.digits, k=4))
        
        try:
            phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
            phone_number = int(phone_clean)
            
            try:
                original_verify = notificore_api.Requester.session.verify
                notificore_api.Requester.session.verify = False
                
                client = notificore_api.SMSAPI(config={'api_key': NOTIFICORE_API_KEY})
                message_text = f'Ваш код подтверждения: {code}'
                
                result = client.send(
                    message=notificore_api.SMSMessage(body=message_text),
                    recipients=notificore_api.Recipient(phone_number)
                )
                
                notificore_api.Requester.session.verify = original_verify
                
                if result and isinstance(result, dict):
                    if result.get('result') or result.get('success'):
                        cache.set(f'verify_code_{phone}', code, 300)
                        return Response({'success': True, 'message': 'Код отправлен в SMS'})
                    else:
                        error_msg = result.get('error') or result.get('message') or 'Ошибка отправки SMS'
                        return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    cache.set(f'verify_code_{phone}', code, 300)
                    return Response({'success': True, 'message': 'Код отправлен в SMS'})
            except Exception as api_err:
                notificore_api.Requester.session.verify = True
                raise api_err
                
        except ValueError:
            return Response({'error': 'Неверный формат номера телефона'}, status=status.HTTP_400_BAD_REQUEST)
        except notificore_api.APIError as e:
            return Response({'error': f'Ошибка API Notificore: {e.description}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Ошибка отправки SMS: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
