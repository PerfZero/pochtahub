from rest_framework import serializers
from .models import Order, OrderEvent


class OrderEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderEvent
        fields = ('id', 'event_type', 'description', 'metadata', 'created_at')
        read_only_fields = ('id', 'created_at')


class OrderSerializer(serializers.ModelSerializer):
    events = OrderEventSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id', 'status', 'sender_name', 'sender_phone', 'sender_address', 'sender_city',
            'recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city',
            'weight', 'length', 'width', 'height', 'transport_company_id', 'transport_company_name',
            'price', 'external_order_uuid', 'external_order_number', 'created_at', 'updated_at', 'events'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'events')


class OrderCreateSerializer(serializers.ModelSerializer):
    length = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    width = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    height = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True)
    
    class Meta:
        model = Order
        fields = (
            'id', 'sender_name', 'sender_phone', 'sender_address', 'sender_city',
            'recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city',
            'weight', 'length', 'width', 'height', 'transport_company_id', 'transport_company_name',
            'price', 'status', 'created_at'
        )
        read_only_fields = ('id', 'status', 'created_at')

    def create(self, validated_data):
        user = self.context['request'].user
        if not user or not user.is_authenticated:
            raise serializers.ValidationError('Требуется авторизация для создания заказа')
        validated_data['user'] = user
        
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
                    
                    tariff_code = order.tariff_code if hasattr(order, 'tariff_code') and order.tariff_code else None
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
                            tariff_code = tariffs[0].get('tariff_code')
                    
                    package_number = f"PKG-{order.id}"
                    order_data = {
                        'tariff_code': tariff_code or 136,
                        'from_location': {
                            'code': from_code,
                            'address': order.sender_address or order.sender_city
                        },
                        'to_location': {
                            'code': to_code,
                            'address': order.recipient_address or order.recipient_city
                        },
                        'recipient': {
                            'name': order.recipient_name,
                            'phones': [{'number': order.recipient_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}]
                        },
                        'sender': {
                            'name': order.sender_name,
                            'phones': [{'number': order.sender_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}]
                        },
                        'packages': [{
                            'number': package_number,
                            'weight': int(float(order.weight) * 1000),
                            'length': int(float(order.length)) if order.length else 10,
                            'width': int(float(order.width)) if order.width else 10,
                            'height': int(float(order.height)) if order.height else 10,
                            'items': [{
                                'name': 'Посылка',
                                'ware_key': f'ITEM-{order.id}',
                                'cost': float(order.price),
                                'weight': int(float(order.weight) * 1000),
                                'amount': 1
                            }]
                        }]
                    }
                    
                    cdek_response = adapter.create_order(order_data)
                    logger.info(f'Заказ создан в CDEK: {cdek_response}')
                    
                    if 'entity' in cdek_response and 'uuid' in cdek_response['entity']:
                        order.external_order_uuid = cdek_response['entity']['uuid']
                    if 'entity' in cdek_response and 'cdek_number' in cdek_response['entity']:
                        order.external_order_number = cdek_response['entity'].get('cdek_number')
                    
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
                        OrderEvent.objects.create(
                            order=order,
                            event_type='shipped',
                            description=f'Заказ создан в CDEK. UUID: {order.external_order_uuid}',
                            metadata={'cdek_response': cdek_response}
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
