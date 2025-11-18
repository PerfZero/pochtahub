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
            'price', 'created_at', 'updated_at', 'events'
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'events')


class OrderCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = (
            'sender_name', 'sender_phone', 'sender_address', 'sender_city',
            'recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city',
            'weight', 'length', 'width', 'height', 'transport_company_id', 'transport_company_name',
            'price'
        )

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        order = Order.objects.create(**validated_data)
        OrderEvent.objects.create(
            order=order,
            event_type='created',
            description='Заказ создан'
        )
        return order


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.STATUS_CHOICES)
