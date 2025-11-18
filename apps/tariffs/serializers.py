from rest_framework import serializers
from .models import TransportCompany, Tariff


class TransportCompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportCompany
        fields = ('id', 'name', 'code', 'is_active')


class TariffSerializer(serializers.ModelSerializer):
    transport_company = TransportCompanySerializer(read_only=True)

    class Meta:
        model = Tariff
        fields = ('id', 'transport_company', 'name', 'min_weight', 'max_weight', 'base_price', 'price_per_kg', 'is_active')


class CalculatePriceSerializer(serializers.Serializer):
    weight = serializers.DecimalField(max_digits=10, decimal_places=2, required=True)
    length = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    width = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    height = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    transport_company_id = serializers.IntegerField(required=False)
