from rest_framework import serializers
from .models import Order, OrderEvent
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
import uuid
import requests
import os

User = get_user_model()


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = ('id', 'event_type', 'description', 'metadata', 'created_at')
        read_only_fields = ('id', 'created_at')


class OrderSerializer(serializers.ModelSerializer):
    events = OrderEventSerializer(many=True, read_only=True)
    package_image = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'sender_name', 'sender_phone', 'sender_address', 'sender_city',
            'sender_company', 'sender_tin', 'sender_contragent_type',
            'recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city',
            'recipient_delivery_point_code', 'recipient_delivery_point_address', 'weight', 'length', 'width', 'height', 'package_image', 'transport_company_id', 'transport_company_name',
            'price', 'external_order_uuid', 'external_order_number', 'created_at', 'updated_at', 'events'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'events')

    def get_package_image(self, obj):
        if obj.package_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.package_image.url)
            else:
                from django.conf import settings
                return f"{settings.MEDIA_URL}{obj.package_image}"
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    length = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    width = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    height = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    weight = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    package_image = serializers.URLField(required=False, allow_null=True, allow_blank=True)
    selected_role = serializers.CharField(required=False, write_only=True)
    
    class Meta:
        model = Order
        fields = (
            'id', 'sender_name', 'sender_phone', 'sender_address', 'sender_city',
            'sender_company', 'sender_tin', 'sender_contragent_type',
            'recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city',
            'recipient_delivery_point_code', 'recipient_delivery_point_address', 'weight', 'length', 'width', 'height', 'package_image',
            'transport_company_id', 'transport_company_name',
            'tariff_code', 'tariff_name', 'price', 'status', 'created_at', 'selected_role'
        )
        read_only_fields = ('id', 'status', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        selected_role = validated_data.pop('selected_role', None)
        
        if not user or not user.is_authenticated:
            phone_to_use = None
            name_to_use = None
            
            if selected_role == 'recipient':
                recipient_phone = validated_data.get('recipient_phone', '')
                if recipient_phone:
                    phone_to_use = recipient_phone
                    name_to_use = validated_data.get('recipient_name', '')
            else:
                sender_phone = validated_data.get('sender_phone', '')
                if sender_phone:
                    phone_to_use = sender_phone
                    name_to_use = validated_data.get('sender_name', '')
            
            if phone_to_use:
                phone_clean = phone_to_use.replace(' ', '').replace('-', '').replace('(', '').replace(')', '').replace('+', '')
                if not phone_clean.startswith('+'):
                    phone_clean = '+' + phone_clean
                
                try:
                    user = User.objects.get(phone=phone_clean)
                except User.DoesNotExist:
                    username = f"user_{phone_clean.replace('+', '')}_{uuid.uuid4().hex[:6]}"
                    user = User.objects.create_user(
                        username=username,
                        phone=phone_clean,
                        first_name=name_to_use[:30] if name_to_use else ''
                    )
        
        validated_data['user'] = user
        
        package_image_url = validated_data.pop('package_image', None)
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f'Получен package_image_url: {package_image_url}')
        if package_image_url and isinstance(package_image_url, str) and package_image_url.strip():
            try:
                from django.conf import settings
                from urllib.parse import urlparse
                import logging
                logger = logging.getLogger(__name__)
                
                parsed_url = urlparse(package_image_url)
                path = parsed_url.path
                
                if '/media/' in path or 'package_images' in path:
                    if '/media/' in path:
                        file_path = path.split('/media/')[-1]
                    else:
                        parts = path.split('package_images/')
                        if len(parts) > 1:
                            file_path = f'package_images/{parts[-1]}'
                        else:
                            file_path = None
                    
                    if file_path and file_path.startswith('package_images/'):
                        if default_storage.exists(file_path):
                            validated_data['package_image'] = file_path
                            logger.info(f'Используем существующий файл: {file_path}')
                        else:
                            logger.warning(f'Файл не найден: {file_path}, пытаемся скачать')
                            response = requests.get(package_image_url, timeout=10)
                            response.raise_for_status()
                            file_name = os.path.basename(file_path) or f'package_{uuid.uuid4().hex[:8]}.jpg'
                            file_path = default_storage.save(
                                f'package_images/{file_name}',
                                ContentFile(response.content)
                            )
                            validated_data['package_image'] = file_path
                            logger.info(f'Изображение скачано и сохранено: {file_path}')
                    else:
                        logger.warning(f'Не удалось извлечь путь к файлу из URL: {package_image_url}')
                        validated_data['package_image'] = None
                else:
                    response = requests.get(package_image_url, timeout=10)
                    response.raise_for_status()
                    file_name = os.path.basename(parsed_url.path)
                    if not file_name or '.' not in file_name:
                        file_name = f'package_{uuid.uuid4().hex[:8]}.jpg'
                    file_path = default_storage.save(
                        f'package_images/{file_name}',
                        ContentFile(response.content)
                    )
                    validated_data['package_image'] = file_path
                    logger.info(f'Изображение скачано и сохранено: {file_path}')
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f'Ошибка обработки изображения по URL {package_image_url}: {str(e)}', exc_info=True)
                validated_data['package_image'] = None
        else:
            validated_data['package_image'] = None
        
        order = Order.objects.create(**validated_data)
        OrderEvent.objects.create(
            order=order,
            event_type='created',
            description='Заказ создан'
        )
            
        transport_company_id = validated_data.get('transport_company_id')
        if transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter
            import logging
            
            logger = logging.getLogger(__name__)
            
            try:
                company = TransportCompany.objects.get(id=transport_company_id)
                if company.api_type == 'cdek' and company.api_account and company.api_secure_password:
                    logger.info(f'Создание заказа в CDEK для заказа #{order.id}')
                    
                    adapter = CDEKAdapter(
                        account=company.api_account,
                        secure_password=company.api_secure_password,
                        test_mode=False
                    )
                    
                    from_code = adapter._get_city_code(order.sender_city)
                    to_code = adapter._get_city_code(order.recipient_city)
                    
                    if not from_code:
                        raise Exception(f'Город отправления "{order.sender_city}" не найден в CDEK')
                    if not to_code:
                        raise Exception(f'Город назначения "{order.recipient_city}" не найден в CDEK')
                    
                    recipient_delivery_point_code = getattr(order, 'recipient_delivery_point_code', None)
                    
                    tariff_code = order.tariff_code if hasattr(order, 'tariff_code') and order.tariff_code else None
                    
                    pvz_tariff_codes = [136, 137, 138, 139, 62, 63, 233, 234, 235, 236, 237, 238, 239, 240]
                    
                    if recipient_delivery_point_code and tariff_code and tariff_code not in pvz_tariff_codes:
                        logger.warning(f'Выбранный тариф {tariff_code} не поддерживает ПВЗ, пересчитываю тарифы')
                        tariff_code = None
                    
                    if not tariff_code:
                        tariffs = adapter.calculate_price(
                            from_city=order.sender_city,
                            to_city=order.recipient_city,
                            weight=float(order.weight),
                            length=float(order.length) if order.length else None,
                            width=float(order.width) if order.width else None,
                            height=float(order.height) if order.height else None
                        )
                        if tariffs:
                            if recipient_delivery_point_code:
                                pvz_tariffs = [t for t in tariffs if t.get('tariff_code') in pvz_tariff_codes]
                                if pvz_tariffs:
                                    tariff_code = pvz_tariffs[0].get('tariff_code')
                                    logger.info(f'Выбран тариф для ПВЗ: {tariff_code}')
                                else:
                                    logger.warning(f'Не найдено тарифов для ПВЗ, используем первый доступный')
                                    tariff_code = tariffs[0].get('tariff_code')
                            else:
                                tariff_code = tariffs[0].get('tariff_code')
                    
                    package_number = f"PKG-{order.id}"
                    
                    to_location = {
                        'code': to_code,
                        'address': order.recipient_address or order.recipient_city
                    }
                    
                    delivery_point_value = None
                    if recipient_delivery_point_code:
                        if '-' in recipient_delivery_point_code:
                            delivery_point_value = recipient_delivery_point_code
                            logger.info(f'Используем UUID ПВЗ: {delivery_point_value}')
                        else:
                            try:
                                points = adapter.get_delivery_points(city=order.recipient_city, size=100)
                                point = next((p for p in points if p.get('code') == recipient_delivery_point_code), None)
                                if point and point.get('uuid'):
                                    delivery_point_value = point.get('uuid')
                                    logger.info(f'Найден UUID ПВЗ: {delivery_point_value} по коду: {recipient_delivery_point_code}')
                                else:
                                    delivery_point_value = recipient_delivery_point_code
                                    logger.warning(f'ПВЗ с кодом {recipient_delivery_point_code} не найден, используем код как есть')
                            except Exception as e:
                                logger.error(f'Ошибка поиска ПВЗ: {str(e)}, используем код')
                                delivery_point_value = recipient_delivery_point_code
                    
                    if delivery_point_value:
                        to_location['delivery_point'] = delivery_point_value
                    
                    items_data = {
                        'name': 'Посылка',
                        'ware_key': f'ITEM-{order.id}',
                        'cost': float(order.price),
                        'weight': int(float(order.weight) * 1000),
                        'amount': 1,
                        'payment': {'value': 0.0 if recipient_delivery_point_code else float(order.price)}
                    }
                    
                    sender_company = order.sender_company or user.sender_company or order.sender_name.strip()
                    
                    sender_data = {
                        'name': order.sender_name.strip(),
                        'company': sender_company,
                        'phones': [{'number': order.sender_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}]
                    }
                    
                    contragent_type = order.sender_contragent_type or user.sender_contragent_type
                    if contragent_type:
                        sender_data['contragent_type'] = contragent_type
                    
                    sender_tin = order.sender_tin or user.sender_tin
                    if sender_tin:
                        sender_data['tin'] = sender_tin
                    
                    seller_data = None
                    if sender_company or sender_tin:
                        seller_data = {
                            'name': sender_company or order.sender_name.strip()
                        }
                        if sender_tin:
                            seller_data['inn'] = sender_tin
                        seller_data['phone'] = order.sender_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
                        seller_data['address'] = order.sender_address or order.sender_city
                    
                    order_data = {
                        'type': 1,
                        'number': str(order.id),
                        'tariff_code': tariff_code or 136,
                        'sender': sender_data,
                        'recipient': {
                            'name': order.recipient_name,
                            'phones': [{'number': order.recipient_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}]
                        },
                        'from_location': {
                            'code': from_code,
                            'address': order.sender_address or order.sender_city
                        },
                        'packages': [{
                            'number': str(order.id),
                            'weight': int(float(order.weight) * 1000),
                            'length': max(1, int(float(order.length))) if order.length and float(order.length) > 0 else (10 if float(order.weight) > 0.1 else 1),
                            'width': max(1, int(float(order.width))) if order.width and float(order.width) > 0 else (10 if float(order.weight) > 0.1 else 1),
                            'height': max(1, int(float(order.height))) if order.height and float(order.height) > 0 else (10 if float(order.weight) > 0.1 else 1),
                            'comment': f'Посылка #{order.id}',
                            'items': [items_data]
                        }]
                    }
                    
                    if delivery_point_value:
                        order_data['delivery_point'] = delivery_point_value
                    else:
                        order_data['to_location'] = {
                            'code': to_code,
                            'address': order.recipient_address or order.recipient_city
                        }
                    
                    if seller_data:
                        order_data['seller'] = seller_data
                    
                    cdek_response = adapter.create_order(order_data)
                    logger.info(f'Заказ создан в CDEK: {cdek_response}')
                    
                    if 'entity' in cdek_response and 'uuid' in cdek_response['entity']:
                        order.external_order_uuid = cdek_response['entity']['uuid']
                        if 'cdek_number' in cdek_response['entity']:
                            order.external_order_number = cdek_response['entity'].get('cdek_number')
                            logger.info(f'Номер заказа CDEK получен сразу: {order.external_order_number}')
                        else:
                            import time
                            max_attempts = 5
                            for attempt in range(1, max_attempts + 1):
                                time.sleep(2 * attempt)
                                try:
                                    order_info = adapter.get_order_info(order_uuid=order.external_order_uuid)
                                    logger.info(f'Попытка {attempt}: Информация о заказе CDEK получена')
                                    if 'entity' in order_info and 'cdek_number' in order_info['entity']:
                                        cdek_number = order_info['entity'].get('cdek_number')
                                        if cdek_number:
                                            order.external_order_number = cdek_number
                                            logger.info(f'Получен номер заказа CDEK: {order.external_order_number}')
                                            break
                                    if attempt < max_attempts:
                                        logger.info(f'Номер заказа CDEK еще не присвоен, попытка {attempt}/{max_attempts}')
                                    else:
                                        logger.warning('Номер заказа CDEK не получен после всех попыток')
                                except Exception as e:
                                    logger.warning(f'Попытка {attempt}: Не удалось получить номер заказа CDEK: {str(e)}')
                                    if attempt < max_attempts:
                                        continue
                                    else:
                                        logger.error(f'Не удалось получить номер заказа CDEK после {max_attempts} попыток')
                    
                    has_errors = False
                    error_messages = []
                    if 'requests' in cdek_response:
                        for req in cdek_response['requests']:
                            if req.get('state') == 'INVALID' and req.get('errors'):
                                has_errors = True
                                for err in req.get('errors', []):
                                    error_messages.append(f"{err.get('code')}: {err.get('message')}")
                    
                    if has_errors:
                        logger.warning(f'Заказ создан в CDEK с ошибками: {error_messages}')
                        order.status = 'cancelled'
                        OrderEvent.objects.create(
                            order=order,
                            event_type='cancelled',
                            description=f'Заказ создан в CDEK с ошибками: {"; ".join(error_messages)}',
                            metadata={'cdek_response': cdek_response, 'errors': error_messages}
                        )
                    else:
                        if not delivery_point_value:
                            try:
                                from datetime import datetime, timedelta
                                tomorrow = datetime.now() + timedelta(days=1)
                                courier_date = tomorrow.strftime('%Y-%m-%d')
                                courier_time_from = '10:00'
                                courier_time_to = '18:00'
                                
                                courier_result = adapter._call_courier(
                                    order_id=order.external_order_uuid,
                                    courier_date=courier_date,
                                    courier_time_from=courier_time_from,
                                    courier_time_to=courier_time_to
                                )
                                
                                if courier_result:
                                    logger.info(f'Курьер успешно вызван для заказа {order.external_order_uuid}')
                                    OrderEvent.objects.create(
                                        order=order,
                                        event_type='shipped',
                                        description=f'Заказ создан в CDEK. UUID: {order.external_order_uuid}. Курьер вызван на {courier_date} с {courier_time_from} до {courier_time_to}',
                                        metadata={'cdek_response': cdek_response, 'courier_called': True, 'courier_date': courier_date}
                                    )
                                else:
                                    logger.warning(f'Не удалось вызвать курьера для заказа {order.external_order_uuid}')
                                    OrderEvent.objects.create(
                                        order=order,
                                        event_type='shipped',
                                        description=f'Заказ создан в CDEK. UUID: {order.external_order_uuid}. Не удалось вызвать курьера',
                                        metadata={'cdek_response': cdek_response, 'courier_called': False}
                                    )
                            except Exception as e:
                                logger.error(f'Ошибка вызова курьера: {str(e)}', exc_info=True)
                                OrderEvent.objects.create(
                                    order=order,
                                    event_type='shipped',
                                    description=f'Заказ создан в CDEK. UUID: {order.external_order_uuid}. Ошибка вызова курьера: {str(e)}',
                                    metadata={'cdek_response': cdek_response, 'courier_error': str(e)}
                                )
                        else:
                            logger.info(f'Заказ в ПВЗ, курьер не требуется')
                            OrderEvent.objects.create(
                                order=order,
                                event_type='shipped',
                                description=f'Заказ создан в CDEK. UUID: {order.external_order_uuid}. Доставка в ПВЗ: {delivery_point_value}',
                                metadata={'cdek_response': cdek_response, 'delivery_point': delivery_point_value}
                            )
                    
                    order.save()
            except Exception as e:
                logger.error(f'Ошибка создания заказа в CDEK: {str(e)}', exc_info=True)
                OrderEvent.objects.create(
                    order=order,
                    event_type='created',
                    description=f'Ошибка создания заказа в CDEK: {str(e)}',
                    metadata={'error': str(e)}
                )
        
        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
