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
        user = self.context['request'].user if self.context['request'].user.is_authenticated else None
        if user:
            validated_data['user'] = user
        else:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            anonymous_user, _ = User.objects.get_or_create(
                username='anonymous',
                defaults={'email': '', 'is_active': False}
            )
            validated_data['user'] = anonymous_user
        
        order = Order.objects.create(**validated_data)
        OrderEvent.objects.create(
            order=order,
            event_type='created',
            description='Заказ создан'
        )
        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
