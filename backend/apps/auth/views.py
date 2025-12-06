from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.cache import cache
from .serializers import RegisterSerializer, LoginSerializer
import requests
import random
import string


TELEGRAM_GATEWAY_TOKEN = "AAEXLwAAdHj0Jv-fq4mKpbRYx_Amf6DhvRiK1Ui7jRn6Eg"


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
            response = requests.post(
                'https://gatewayapi.telegram.org/sendVerificationMessage',
                headers={
                    'Authorization': f'Bearer {TELEGRAM_GATEWAY_TOKEN}',
                    'Content-Type': 'application/json'
                },
                json={
                    'phone_number': phone,
                    'code': code,
                    'code_length': 4,
                    'ttl': 300
                }
            )
            
            result = response.json()
            
            if result.get('ok'):
                cache.set(f'verify_code_{phone}', code, 300)
                return Response({'success': True, 'message': 'Код отправлен в Telegram'})
            else:
                error_msg = result.get('error', 'Ошибка отправки')
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        
        return Response({'success': True, 'message': 'Телефон подтверждён'})


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
