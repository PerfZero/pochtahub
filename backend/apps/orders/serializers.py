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
    transport_company_logo = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'sender_name', 'sender_phone', 'sender_email', 'sender_address', 'sender_city',
            'sender_company', 'sender_tin', 'sender_contragent_type',
            'recipient_name', 'recipient_phone', 'recipient_email', 'recipient_address', 'recipient_city',
            'recipient_delivery_point_code', 'recipient_delivery_point_address', 'weight', 'length', 'width', 'height', 'package_image', 'transport_company_id', 'transport_company_name', 'transport_company_logo',
            'price', 'external_order_uuid', 'external_order_number', 'created_at', 'updated_at', 'events',
            'packaging_price', 'insurance_price', 'pochtahub_commission', 'acquiring_price', 'total_price', 'needs_packaging'
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

    def get_transport_company_logo(self, obj):
        if obj.transport_company_id:
            try:
                from apps.tariffs.models import TransportCompany
                company = TransportCompany.objects.get(id=obj.transport_company_id)
                if company.logo:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(company.logo.url)
                    else:
                        from django.conf import settings
                        if company.logo.url.startswith('/'):
                            return company.logo.url
                        return f"/{settings.MEDIA_URL}{company.logo.url}" if not company.logo.url.startswith(settings.MEDIA_URL) else f"/{company.logo.url}"
            except TransportCompany.DoesNotExist:
                pass
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
            'id', 'sender_name', 'sender_phone', 'sender_email', 'sender_address', 'sender_city',
            'sender_company', 'sender_tin', 'sender_contragent_type',
            'recipient_name', 'recipient_phone', 'recipient_email', 'recipient_address', 'recipient_city',
            'recipient_delivery_point_code', 'recipient_delivery_point_address', 'weight', 'length', 'width', 'height', 'package_image',
            'transport_company_id', 'transport_company_name',
            'tariff_code', 'tariff_name', 'price', 'status', 'created_at', 'selected_role', 'needs_packaging',
            'packaging_price', 'insurance_price', 'pochtahub_commission', 'acquiring_price', 'total_price'
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

        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
