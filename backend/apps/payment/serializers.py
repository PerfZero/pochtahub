from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            'id',
            'order',
            'amount',
            'status',
            'payment_id',
            'confirmation_url',
            'created_at',
            'updated_at',
        )
        read_only_fields = (
            'id',
            'status',
            'payment_id',
            'confirmation_url',
            'created_at',
            'updated_at',
        )


class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField(required=True)
