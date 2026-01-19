from django.urls import path
from .views import PaymentCreateView, PaymentStatusView, YooKassaWebhookView

urlpatterns = [
    path('create/', PaymentCreateView.as_view(), name='payment-create'),
    path('yookassa/webhook/', YooKassaWebhookView.as_view(), name='payment-yookassa-webhook'),
    path('<int:pk>/', PaymentStatusView.as_view(), name='payment-status'),
]
