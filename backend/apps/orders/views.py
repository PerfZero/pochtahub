from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Order, OrderEvent
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer


class OrderListView(generics.ListCreateAPIView):
    serializer_class = OrderSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.none()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if self.request.method == 'GET':
            return Order.objects.all()
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.none()

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = instance.status
        new_status = serializer.validated_data['status']
        instance.status = new_status
        instance.save()

        OrderEvent.objects.create(
            order=instance,
            event_type='status_changed',
            description=f'Статус изменен с {instance.get_status_display()} на {instance.get_status_display()}',
            metadata={'old_status': old_status, 'new_status': new_status}
        )

        return Response(OrderSerializer(instance).data)
