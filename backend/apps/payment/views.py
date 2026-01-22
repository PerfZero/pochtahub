import uuid
import requests
import logging
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer, PaymentCreateSerializer
from apps.orders.models import Order, OrderEvent
from apps.orders.cdek_service import create_cdek_order

logger = logging.getLogger('apps.payment')

NOTIFICORE_API_KEY = "live_0pi2ZdK61Yq0HwcLhRfS"
NOTIFICORE_API_URL_V1 = "https://api.notificore.ru/rest"

YOOKASSA_API_URL = getattr(settings, 'YOOKASSA_API_URL', 'https://api.yookassa.ru/v3/payments')
YOOKASSA_SHOP_ID = getattr(settings, 'YOOKASSA_SHOP_ID', None)
YOOKASSA_SECRET_KEY = getattr(settings, 'YOOKASSA_SECRET_KEY', None)
YOOKASSA_NOTIFICATION_URL = getattr(settings, 'YOOKASSA_NOTIFICATION_URL', None)


def send_order_sms(phone, order_id, order_price):
    """Отправляет SMS со ссылкой на заказ после оплаты"""
    try:
        logger.info(f'[SMS] Начало отправки SMS для заказа #{order_id}, исходный номер: {phone}')
        phone_clean = phone.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        phone_number = int(phone_clean)
        logger.info(f'[SMS] Очищенный номер: {phone_number}')

        base_url = getattr(settings, 'FRONTEND_URL', 'https://pochtahab.ru')
        if 'localhost' in base_url or '127.0.0.1' in base_url:
            base_url = 'https://pochtahab.ru'
        order_url = f"{base_url}/confirmation/{order_id}"

        message_text = f'PochtaHub. {order_url}'
        logger.info(f'[SMS] Текст сообщения: {message_text}')

        headers = {
            'X-API-KEY': NOTIFICORE_API_KEY,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
        }

        import time
        import random
        reference = f'order_{order_id}_{int(time.time())}_{random.randint(1000, 9999)}'

        payload = {
            'destination': 'phone',
            'body': message_text,
            'msisdn': str(phone_number),
            'originator': 'PochtaHub',
            'reference': reference
        }

        logger.info(f'[SMS] Отправка SMS о заказе #{order_id} на номер {phone_number}')
        response = requests.post(
            f'{NOTIFICORE_API_URL_V1}/sms/create',
            json=payload,
            headers=headers,
            timeout=30,
            verify=True
        )

        logger.info(f'[SMS] Ответ API: статус {response.status_code}, тело: {response.text[:200]}')

        if response.status_code != 200:
            logger.error(f'[SMS] Ошибка HTTP для заказа #{order_id}: статус {response.status_code}, ответ: {response.text[:200]}')
            return False

        result = response.json()
        logger.info(f'[SMS] Ответ API для заказа #{order_id}: {result}')

        if isinstance(result, dict):
            result_data = result.get('result')
            if isinstance(result_data, dict):
                error_code = result_data.get('error')
                if error_code == 0:
                    logger.info(f'[SMS] SMS успешно отправлена для заказа #{order_id}')
                    return True
                else:
                    error_desc = result_data.get('errorDescription', 'Неизвестная ошибка')
                    logger.error(f'[SMS] Ошибка SMS API для заказа #{order_id}: код {error_code}, описание: {error_desc}')
                    return False
            else:
                logger.warning(f'[SMS] Неожиданный формат ответа от SMS API для заказа #{order_id}: {result}')
                return False
        else:
            logger.warning(f'[SMS] Неожиданный ответ от SMS API для заказа #{order_id}: {result}')
            return False

    except Exception as e:
        logger.error(f'Исключение при отправке SMS для заказа #{order_id}: {str(e)}', exc_info=True)
        return False


def _build_return_url(order_id):
    base_url = getattr(settings, 'FRONTEND_URL', 'https://pochtahab.ru').rstrip('/')
    return f'{base_url}/confirmation/{order_id}'


def _normalize_amount(value):
    amount = Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    return f'{amount:.2f}'


def _get_order_amount(order):
    if order.total_price and order.total_price > 0:
        return order.total_price
    return order.price


def _send_payment_received(order, payment):
    if order.status != 'paid':
        order.status = 'paid'
        order.save(update_fields=['status', 'updated_at'])

    OrderEvent.objects.create(
        order=order,
        event_type='payment_received',
        description=f'Получена оплата на сумму {payment.amount}',
        metadata={'payment_id': payment.payment_id}
    )

    try:
        create_cdek_order(order)
    except Exception as e:
        logger.error('[PAYMENT] Ошибка создания заказа в CDEK после оплаты: %s', str(e), exc_info=True)

    def clean_phone(phone_str):
        if not phone_str:
            return None
        cleaned = phone_str.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
        if not cleaned.startswith('+'):
            cleaned = '+' + cleaned
        return cleaned

    user = payment.user
    phone_to_notify = None
    user_phone_clean = clean_phone(user.phone) if user and user.phone else None
    sender_phone_clean = clean_phone(order.sender_phone)
    recipient_phone_clean = clean_phone(order.recipient_phone)

    if user_phone_clean:
        if user_phone_clean == sender_phone_clean:
            phone_to_notify = order.recipient_phone
            logger.info(f'[PAYMENT] Заказ создан отправителем, отправляем SMS получателю: {phone_to_notify}')
        elif user_phone_clean == recipient_phone_clean:
            phone_to_notify = order.sender_phone
            logger.info(f'[PAYMENT] Заказ создан получателем, отправляем SMS отправителю: {phone_to_notify}')
        else:
            phone_to_notify = order.recipient_phone
            logger.info(f'[PAYMENT] Роль не определена, отправляем SMS получателю: {phone_to_notify}')
    else:
        phone_to_notify = order.recipient_phone
        logger.info(f'[PAYMENT] Телефон пользователя не указан, отправляем SMS получателю: {phone_to_notify}')

    if phone_to_notify:
        logger.info(f'[PAYMENT] Отправка SMS для заказа #{order.id} на номер: {phone_to_notify}')
        try:
            result = send_order_sms(
                phone=phone_to_notify,
                order_id=order.id,
                order_price=order.price
            )
            logger.info(f'[PAYMENT] Результат отправки SMS: {result}')
        except Exception as e:
            logger.error(f'[PAYMENT] Ошибка при вызове send_order_sms: {str(e)}', exc_info=True)


def _create_yookassa_payment(order, idempotence_key):
    if not YOOKASSA_SHOP_ID or not YOOKASSA_SECRET_KEY:
        raise ValueError('YooKassa credentials are not configured')

    amount_value = _get_order_amount(order)
    payload = {
        'amount': {
            'value': _normalize_amount(amount_value),
            'currency': 'RUB',
        },
        'confirmation': {
            'type': 'redirect',
            'return_url': _build_return_url(order.id),
        },
        'capture': True,
        'description': f'Оплата заказа #{order.id}',
        'metadata': {
            'order_id': str(order.id),
        },
    }

    if YOOKASSA_NOTIFICATION_URL:
        payload['notification_url'] = YOOKASSA_NOTIFICATION_URL

    headers = {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotence_key,
    }

    response = requests.post(
        YOOKASSA_API_URL,
        json=payload,
        headers=headers,
        auth=(YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY),
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


class PaymentCreateView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PaymentCreateSerializer

    def post(self, request, *args, **kwargs):
        logger.info(f'[PAYMENT] Получен запрос на оплату: {request.data}')
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        logger.info(f'[PAYMENT] Обработка оплаты для заказа #{order_id}')
        try:
            if request.user.is_authenticated:
                order = Order.objects.get(id=order_id, user=request.user)
            else:
                order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Заказ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status == 'paid':
            existing_payment = Payment.objects.filter(order=order, status='success').first()
            if existing_payment:
                logger.warning(f'[PAYMENT] Заказ #{order_id} уже оплачен, платеж #{existing_payment.id}')
            return Response(
                {'error': 'Заказ уже оплачен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        existing_payment = Payment.objects.filter(order=order, status='success').first()
        if existing_payment:
            logger.warning(f'[PAYMENT] Для заказа #{order_id} уже существует успешный платеж #{existing_payment.id}')
            return Response(
                {'error': 'Платеж уже обработан'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pending_payment = Payment.objects.filter(order=order, status='pending').order_by('-created_at').first()
        if pending_payment and pending_payment.confirmation_url:
            logger.info(f'[PAYMENT] Возвращаем существующий платеж #{pending_payment.id} для заказа #{order_id}')
            return Response({
                'payment': PaymentSerializer(pending_payment).data,
                'confirmation_url': pending_payment.confirmation_url,
                'message': 'Платеж ожидает оплаты'
            }, status=status.HTTP_200_OK)

        user = request.user if request.user.is_authenticated else order.user
        idempotence_key = uuid.uuid4().hex

        try:
            yookassa_payment = _create_yookassa_payment(order, idempotence_key)
            logger.info(
                "[PAYMENT] YooKassa payment created: id=%s status=%s test=%s",
                yookassa_payment.get('id'),
                yookassa_payment.get('status'),
                yookassa_payment.get('test'),
            )
        except requests.RequestException as exc:
            logger.error(f'[PAYMENT] Ошибка YooKassa для заказа #{order_id}: {str(exc)}', exc_info=True)
            return Response(
                {'error': 'Ошибка создания платежа'},
                status=status.HTTP_502_BAD_GATEWAY
            )
        except ValueError as exc:
            logger.error(f'[PAYMENT] Ошибка конфигурации YooKassa: {str(exc)}')
            return Response(
                {'error': 'Платежный сервис не настроен'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        amount_value = _get_order_amount(order)
        payment = Payment.objects.create(
            order=order,
            user=user,
            amount=amount_value,
            payment_id=yookassa_payment.get('id'),
            confirmation_url=yookassa_payment.get('confirmation', {}).get('confirmation_url'),
            idempotence_key=idempotence_key,
            status='pending',
        )

        if order.status != 'pending_payment':
            order.status = 'pending_payment'
            order.save(update_fields=['status', 'updated_at'])

        return Response({
            'payment': PaymentSerializer(payment).data,
            'confirmation_url': payment.confirmation_url,
            'yookassa_test': yookassa_payment.get('test'),
            'order_status': order.status,
            'message': 'Платеж создан'
        }, status=status.HTTP_201_CREATED)


class PaymentStatusView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)


class YooKassaWebhookView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        payload = request.data or {}
        event = payload.get('event')
        data = payload.get('object') or {}
        payment_id = data.get('id')
        payment_status = data.get('status')
        metadata = data.get('metadata') or {}

        if not payment_id:
            logger.warning('[PAYMENT] YooKassa webhook without payment id')
            return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

        payment = Payment.objects.filter(payment_id=payment_id).first()
        if not payment and metadata.get('order_id'):
            payment = Payment.objects.filter(order_id=metadata['order_id'], status='pending').first()

        if not payment:
            logger.warning(f'[PAYMENT] YooKassa webhook: payment not found {payment_id}')
            return Response({'status': 'ignored'}, status=status.HTTP_200_OK)

        if payment.payment_id != payment_id:
            payment.payment_id = payment_id

        if payment_status == 'succeeded':
            if payment.status != 'success':
                payment.status = 'success'
                payment.save(update_fields=['status', 'payment_id', 'updated_at'])
                _send_payment_received(payment.order, payment)
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)

        if payment_status in ['canceled', 'failed']:
            if payment.status != 'failed':
                payment.status = 'failed'
                payment.save(update_fields=['status', 'payment_id', 'updated_at'])
            return Response({'status': 'ok'}, status=status.HTTP_200_OK)

        logger.info(f'[PAYMENT] YooKassa webhook ignored event {event} status {payment_status}')
        return Response({'status': 'ignored'}, status=status.HTTP_200_OK)
