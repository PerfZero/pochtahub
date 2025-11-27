from django.urls import path
from .views import TransportCompanyListView, CalculatePriceView, AnalyzeImageView

urlpatterns = [
    path('companies/', TransportCompanyListView.as_view(), name='transport-companies'),
    path('calculate/', CalculatePriceView.as_view(), name='calculate-price'),
    path('analyze-image/', AnalyzeImageView.as_view(), name='analyze-image'),
]
