from django.urls import path
from .views import TransportCompanyListView, CalculatePriceView, AnalyzeImageView, DeliveryPointsView, GetTariffsView, CdekWidgetServiceView

urlpatterns = [
    path('companies/', TransportCompanyListView.as_view(), name='transport-companies'),
    path('calculate/', CalculatePriceView.as_view(), name='calculate-price'),
    path('analyze-image/', AnalyzeImageView.as_view(), name='analyze-image'),
    path('delivery-points/', DeliveryPointsView.as_view(), name='delivery-points'),
    path('get-tariffs/', GetTariffsView.as_view(), name='get-tariffs'),
    path('cdek-widget-service/', CdekWidgetServiceView.as_view(), name='cdek-widget-service'),
]
