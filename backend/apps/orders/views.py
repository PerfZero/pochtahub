from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Order, OrderEvent, AppSettings, InviteLink
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer
import logging
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404, redirect
from django.utils.crypto import get_random_string
import json
import requests
from urllib.parse import quote
import base64
from django.conf import settings

logger = logging.getLogger(__name__)
NOTIFICORE_API_KEY = "live_0pi2ZdK61Yq0HwcLhRfS"
NOTIFICORE_API_URL_V1 = "https://api.notificore.ru/rest"


class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return Order.objects.all()
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.none()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = instance.status
        new_status = serializer.validated_data['status']
        instance.status = new_status
        instance.save()

        OrderEvent.objects.create(
            order=instance,
            event_type='status_changed',
            description=f'Статус изменен с {instance.get_status_display()} на {instance.get_status_display()}',
            metadata={'old_status': old_status, 'new_status': new_status}
        )

        return Response(OrderSerializer(instance, context={'request': request}).data)


def map_cdek_status_to_order_status(cdek_status_code: str) -> str:
    status_mapping = {
        'ACCEPTED': 'in_delivery',
        'RECEIVED_AT_SHIPMENT_WAREHOUSE': 'in_delivery',
        'RECEIVED_AT_DELIVERY_WAREHOUSE': 'in_delivery',
        'DELIVERED': 'completed',
        'NOT_DELIVERED': 'in_delivery',
        'INVALID': 'cancelled',
        'CANCELLED': 'cancelled',
    }
    return status_mapping.get(cdek_status_code, 'in_delivery')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status_from_cdek(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)

        if not order.external_order_uuid and not order.external_order_number:
            return Response({'error': 'Заказ не создан в CDEK'}, status=400)

        if order.transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter

            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)

                adapter = CDEKAdapter(
                    account=company.api_account,
                    secure_password=company.api_secure_password,
                    test_mode=False
                )

                order_info = adapter.get_order_info(
                    order_uuid=order.external_order_uuid,
                    cdek_number=order.external_order_number
                )

                if 'entity' in order_info and 'statuses' in order_info['entity']:
                    statuses = order_info['entity']['statuses']
                    if statuses:
                        latest_status = statuses[-1]
                        cdek_status_code = latest_status.get('code')
                        cdek_status_name = latest_status.get('name', '')
                        status_date = latest_status.get('date_time', '')

                        new_status = map_cdek_status_to_order_status(cdek_status_code)
                        old_status = order.status

                        if new_status != old_status:
                            order.status = new_status
                            order.save()

                            OrderEvent.objects.create(
                                order=order,
                                event_type='status_changed',
                                description=f'Статус обновлен из CDEK: {cdek_status_name} ({cdek_status_code})',
                                metadata={
                                    'old_status': old_status,
                                    'new_status': new_status,
                                    'cdek_status_code': cdek_status_code,
                                    'cdek_status_name': cdek_status_name,
                                    'status_date': status_date,
                                    'all_statuses': statuses
                                }
                            )
                            logger.info(f'Статус заказа {order.id} обновлен: {old_status} -> {new_status} (CDEK: {cdek_status_code})')

                        return Response({
                            'order_id': order.id,
                            'old_status': old_status,
                            'new_status': order.status,
                            'cdek_status': {
                                'code': cdek_status_code,
                                'name': cdek_status_name,
                                'date': status_date
                            },
                            'all_statuses': statuses
                        })
                    else:
                        return Response({'error': 'Статусы не найдены в ответе CDEK'}, status=400)
                else:
                    return Response({'error': 'Информация о заказе не найдена в ответе CDEK'}, status=400)
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
            except Exception as e:
                logger.error(f'Ошибка обновления статуса заказа: {str(e)}', exc_info=True)
                return Response({'error': f'Ошибка обновления статуса: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Транспортная компания не указана'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=404)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_invite_link(request):
    payload = request.data.get('payload')
    if not isinstance(payload, dict):
        return Response({'error': 'payload обязателен'}, status=status.HTTP_400_BAD_REQUEST)

    invite, short_url = _create_invite(payload, request)
    if not invite:
        return Response({'error': 'Не удалось создать ссылку'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return Response({'token': invite.token, 'short_url': short_url})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_invite_sms(request):
    phone = request.data.get('phone')
    payload = request.data.get('payload')
    token = request.data.get('token')
    if not phone:
        return Response({'error': 'phone обязателен'}, status=status.HTTP_400_BAD_REQUEST)

    invite = None
    short_url = None
    if token:
        invite = InviteLink.objects.filter(token=token).first()
        if invite:
            short_url = request.build_absolute_uri(f'/o/{invite.token}')
            if not isinstance(payload, dict):
                payload = invite.payload

    if not invite:
        if not isinstance(payload, dict):
            return Response({'error': 'payload обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        invite, short_url = _create_invite(payload, request)
        if not invite:
            return Response({'error': 'Не удалось создать ссылку'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    sms_ok, sms_task_id, error_text = _send_invite_sms(phone, short_url)
    if not sms_ok:
        invite.sms_status = 'failed'
        invite.sms_task_id = sms_task_id
        invite.save(update_fields=['sms_status', 'sms_task_id'])
        return Response(
            {
                'success': False,
                'short_url': short_url,
                'token': invite.token,
                'sms_task_id': sms_task_id,
                'error': error_text
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )

    invite.sms_status = 'sent'
    invite.sms_task_id = sms_task_id
    invite.save(update_fields=['sms_status', 'sms_task_id'])
    return Response(
        {
            'success': True,
            'short_url': short_url,
            'token': invite.token,
            'sms_task_id': sms_task_id,
            'status': 'sent'
        }
    )


def invite_redirect(request, token):
    invite = get_object_or_404(InviteLink, token=token)
    payload = invite.payload or {}
    payload_json = json.dumps(payload, ensure_ascii=False)
    encoded = base64.b64encode(payload_json.encode('utf-8')).decode('ascii')
    encoded = quote(encoded)
    frontend_base = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
    if not frontend_base:
        frontend_base = request.build_absolute_uri('/').rstrip('/')
    return redirect(f'{frontend_base}/recipient?data={encoded}')


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def invite_sms_status(request, token):
    invite = get_object_or_404(InviteLink, token=token)
    if not invite.sms_task_id:
        return Response({'status': 'unknown', 'token': token})

    status_data, error_text = _get_sms_status(invite.sms_task_id)
    if error_text:
        return Response({'status': 'unknown', 'token': token, 'error': error_text})

    status_label = status_data.get('status', 'unknown')
    invite.sms_status = status_label
    invite.save(update_fields=['sms_status'])
    response = {'status': status_label, 'token': token}
    response.update(status_data)
    return Response(response)


def _create_invite(payload, request):
    token = None
    for _ in range(10):
        candidate = get_random_string(7, allowed_chars='0123456789')
        if not InviteLink.objects.filter(token=candidate).exists():
            token = candidate
            break

    if not token:
        return None, None

    invite = InviteLink.objects.create(token=token, payload=payload)
    short_url = request.build_absolute_uri(f'/o/{token}')
    return invite, short_url


def _send_invite_sms(phone, short_url):
    try:
        phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        phone_number = int(phone_clean)
        message_text = f'PochtaHub. {short_url}'

        headers = {
            'X-API-KEY': NOTIFICORE_API_KEY,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
        }

        import time
        import random
        reference = f'invite_{int(time.time())}_{random.randint(1000, 9999)}'

        payload = {
            'destination': 'phone',
            'body': message_text,
            'msisdn': str(phone_number),
            'originator': 'PochtaHub',
            'reference': reference
        }

        response = requests.post(
            f'{NOTIFICORE_API_URL_V1}/sms/create',
            json=payload,
            headers=headers,
            timeout=30,
            verify=True
        )

        if response.status_code != 200:
            logger.error('[INVITE SMS] HTTP %s: %s', response.status_code, response.text[:200])
            return False, None, f'Ошибка SMS API: HTTP {response.status_code}'

        result = response.json()
        if isinstance(result, dict):
            result_data = result.get('result')
            if isinstance(result_data, dict):
                error_code = result_data.get('error')
                if error_code == 0:
                    task_id = result_data.get('id') or result_data.get('task_id')
                    return True, task_id, None
                return False, result_data.get('id'), result_data.get('errorDescription', 'Ошибка SMS API')
        return False, None, 'Ошибка SMS API'
    except Exception as exc:
        logger.error('[INVITE SMS] Exception: %s', str(exc), exc_info=True)
        return False, None, 'Ошибка отправки SMS'


def _get_sms_status(task_id):
    try:
        response = requests.get(
            f'{NOTIFICORE_API_URL_V1}/sms/{task_id}',
            headers={'X-API-KEY': NOTIFICORE_API_KEY, 'Accept': 'application/json'},
            timeout=30,
            verify=True
        )
        if response.status_code != 200:
            logger.error('[INVITE SMS] Status HTTP %s: %s', response.status_code, response.text[:200])
            return {}, f'HTTP {response.status_code}'

        data = response.json() or {}
        if isinstance(data, dict) and data.get('error'):
            return {}, data.get('errorDescription', 'Ошибка статуса SMS')

        delivered = int(data.get('delivered', 0) or 0)
        expired = int(data.get('expired', 0) or 0)
        undeliverable = int(data.get('undeliverable', 0) or 0)
        unknown = int(data.get('unknown', 0) or 0)

        status_label = 'pending'
        if delivered > 0:
            status_label = 'delivered'
        elif undeliverable > 0:
            status_label = 'undeliverable'
        elif expired > 0:
            status_label = 'expired'
        elif unknown > 0:
            status_label = 'unknown'

        return {
            'status': status_label,
            'delivered': delivered,
            'expired': expired,
            'undeliverable': undeliverable,
            'unknown': unknown,
        }, None
    except Exception as exc:
        logger.error('[INVITE SMS] Status exception: %s', str(exc), exc_info=True)
        return {}, 'Ошибка получения статуса'


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_order_documents(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)

        if not order.external_order_uuid and not order.external_order_number:
            return Response({'error': 'Заказ не создан в CDEK'}, status=400)

        if order.transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter

            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)

                adapter = CDEKAdapter(
                    account=company.api_account,
                    secure_password=company.api_secure_password,
                    test_mode=False
                )

                documents = adapter.get_documents(
                    order_uuid=order.external_order_uuid,
                    cdek_number=order.external_order_number,
                    copy_count=2
                )

                if documents.get('success'):
                    return Response(documents)
                else:
                    return Response({'error': documents.get('error', 'Не удалось получить документы')}, status=500)
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
            except Exception as e:
                logger.error(f'Ошибка получения документов: {str(e)}', exc_info=True)
                return Response({'error': f'Ошибка получения документов: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Транспортная компания не указана'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_order_tracking(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)

        if not order.external_order_uuid and not order.external_order_number:
            return Response({'error': 'Заказ не создан в CDEK'}, status=400)

        if order.transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter

            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)

                adapter = CDEKAdapter(
                    account=company.api_account,
                    secure_password=company.api_secure_password,
                    test_mode=False
                )

                order_info = adapter.get_order_info(
                    order_uuid=order.external_order_uuid,
                    cdek_number=order.external_order_number
                )

                tracking_history = []
                if 'entity' in order_info and 'statuses' in order_info['entity']:
                    statuses = order_info['entity']['statuses']
                    for status_item in statuses:
                        if status_item.get('code') != 'INVALID':
                            tracking_history.append({
                                'date_time': status_item.get('date_time', ''),
                                'status_code': status_item.get('code', ''),
                                'status_name': status_item.get('name', ''),
                                'city': status_item.get('city', ''),
                            })

                    tracking_history.reverse()

                current_status = None
                if tracking_history:
                    current_status = tracking_history[0]

                return Response({
                    'order_id': order.id,
                    'cdek_number': order.external_order_number,
                    'current_status': current_status,
                    'tracking_history': tracking_history,
                })
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
            except Exception as e:
                logger.error(f'Ошибка получения трекинга: {str(e)}', exc_info=True)
                return Response({'error': f'Ошибка получения трекинга: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Транспортная компания не указана'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=404)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def upload_package_image(request):
    try:
        if 'image' not in request.FILES:
            return Response({'error': 'Изображение не предоставлено'}, status=400)

        image_file = request.FILES['image']

        if image_file.size > 5 * 1024 * 1024:
            return Response({'error': 'Файл слишком большой. Максимальный размер 5 МБ.'}, status=400)

        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response({'error': 'Неподдерживаемый тип файла'}, status=400)

        file_name = default_storage.save(
            f'package_images/{image_file.name}',
            ContentFile(image_file.read())
        )

        file_url = request.build_absolute_uri(default_storage.url(file_name))

        return Response({
            'success': True,
            'image_url': file_url,
            'file_name': file_name
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        logger.error(f'Ошибка загрузки изображения: {str(e)}', exc_info=True)
        return Response({'error': f'Ошибка загрузки изображения: {str(e)}'}, status=500)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_app_settings(request):
    try:
        settings = AppSettings.load()
        return Response({
            'packaging_price': float(settings.packaging_price),
            'pochtahub_commission': float(settings.pochtahub_commission),
            'acquiring_percent': float(settings.acquiring_percent),
            'insurance_price': float(settings.insurance_price),
        })
    except Exception as e:
        logger.error(f'Ошибка получения настроек: {str(e)}', exc_info=True)
        return Response({
            'packaging_price': 50.0,
            'pochtahub_commission': 0.0,
            'acquiring_percent': 3.0,
            'insurance_price': 10.0,
        })
