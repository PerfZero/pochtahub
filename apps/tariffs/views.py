from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import TransportCompany, Tariff
from .calculator import TariffCalculator
from .serializers import TransportCompanySerializer, TariffSerializer, CalculatePriceSerializer


class TransportCompanyListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = TransportCompany.objects.filter(is_active=True)
    serializer_class = TransportCompanySerializer


class CalculatePriceView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CalculatePriceSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        weight = float(serializer.validated_data['weight'])
        dimensions = {
            'length': float(serializer.validated_data.get('length', 0)),
            'width': float(serializer.validated_data.get('width', 0)),
            'height': float(serializer.validated_data.get('height', 0)),
        }
        transport_company_id = serializer.validated_data.get('transport_company_id')

        results = TariffCalculator.calculate(weight, dimensions, transport_company_id)

        return Response({
            'weight': weight,
            'dimensions': dimensions,
            'options': results
        })
