from django.urls import path
from .views import PaymentCreateView, PaymentStatusView

urlpatterns = [
    path('create/', PaymentCreateView.as_view(), name='payment-create'),
    path('<int:pk>/', PaymentStatusView.as_view(), name='payment-status'),
]
