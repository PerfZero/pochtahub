from rest_framework import serializers
from .models import TransportCompany, Tariff


class TransportCompanySerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = TransportCompany
        fields = ('id', 'name', 'code', 'api_type', 'is_active', 'logo_url')
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


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
    from_city = serializers.CharField(max_length=200, required=False, help_text='Город отправления (для внешних API)')
    to_city = serializers.CharField(max_length=200, required=False, help_text='Город получения (для внешних API)')
    from_address = serializers.CharField(max_length=500, required=False, help_text='Адрес отправления (для внешних API)')
    to_address = serializers.CharField(max_length=500, required=False, help_text='Адрес получения (для внешних API)')
    transport_company_id = serializers.IntegerField(required=False)
    courier_pickup = serializers.BooleanField(required=False, default=False, help_text='Курьер забирает посылку')
    courier_delivery = serializers.BooleanField(required=False, default=False, help_text='Курьер привозит посылку')
    declared_value = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, allow_null=True, default=None, help_text='Объявленная стоимость для расчета страховки')


class AnalyzeImageSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True)
