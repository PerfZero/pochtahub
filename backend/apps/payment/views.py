import uuid
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Payment
from .serializers import PaymentSerializer, PaymentCreateSerializer
from apps.orders.models import Order, OrderEvent


class PaymentCreateView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PaymentCreateSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_id = serializer.validated_data['order_id']
        try:
            if request.user.is_authenticated:
                order = Order.objects.get(id=order_id, user=request.user)
            else:
                order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Заказ не найден'},
                status=status.HTTP_404_NOT_FOUND
            )

        if order.status == 'paid':
            return Response(
                {'error': 'Заказ уже оплачен'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user if request.user.is_authenticated else order.user

        payment = Payment.objects.create(
            order=order,
            user=user,
            amount=order.price,
            payment_id=str(uuid.uuid4()),
            status='success'
        )

        order.status = 'paid'
        order.save()

        OrderEvent.objects.create(
            order=order,
            event_type='payment_received',
            description=f'Получена оплата на сумму {order.price}',
            metadata={'payment_id': payment.payment_id}
        )

        return Response({
            'payment': PaymentSerializer(payment).data,
            'order_status': order.status,
            'message': 'Оплата успешно обработана'
        }, status=status.HTTP_201_CREATED)


class PaymentStatusView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)
