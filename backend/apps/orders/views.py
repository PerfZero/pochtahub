from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Order, OrderEvent
from .serializers import OrderSerializer, OrderCreateSerializer, OrderStatusUpdateSerializer
import logging

logger = logging.getLogger(__name__)


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


def map_cdek_status_to_order_status(cdek_status_code: str) -> str:
    status_mapping = {
        'ACCEPTED': 'in_delivery',
        'RECEIVED_AT_SHIPMENT_WAREHOUSE': 'in_delivery',
        'RECEIVED_AT_DELIVERY_WAREHOUSE': 'in_delivery',
        'DELIVERED': 'completed',
        'NOT_DELIVERED': 'in_delivery',
        'INVALID': 'cancelled',
        'CANCELLED': 'cancelled',
    }
    return status_mapping.get(cdek_status_code, 'in_delivery')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def update_order_status_from_cdek(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
        
        if not order.external_order_uuid and not order.external_order_number:
            return Response({'error': 'Заказ не создан в CDEK'}, status=400)
        
        if order.transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter
            
            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)
                
                adapter = CDEKAdapter(
                    account=company.api_account,
                    secure_password=company.api_secure_password,
                    test_mode=False
                )
                
                order_info = adapter.get_order_info(
                    order_uuid=order.external_order_uuid,
                    cdek_number=order.external_order_number
                )
                
                if 'entity' in order_info and 'statuses' in order_info['entity']:
                    statuses = order_info['entity']['statuses']
                    if statuses:
                        latest_status = statuses[-1]
                        cdek_status_code = latest_status.get('code')
                        cdek_status_name = latest_status.get('name', '')
                        status_date = latest_status.get('date_time', '')
                        
                        new_status = map_cdek_status_to_order_status(cdek_status_code)
                        old_status = order.status
                        
                        if new_status != old_status:
                            order.status = new_status
                            order.save()
                            
                            OrderEvent.objects.create(
                                order=order,
                                event_type='status_changed',
                                description=f'Статус обновлен из CDEK: {cdek_status_name} ({cdek_status_code})',
                                metadata={
                                    'old_status': old_status,
                                    'new_status': new_status,
                                    'cdek_status_code': cdek_status_code,
                                    'cdek_status_name': cdek_status_name,
                                    'status_date': status_date,
                                    'all_statuses': statuses
                                }
                            )
                            logger.info(f'Статус заказа {order.id} обновлен: {old_status} -> {new_status} (CDEK: {cdek_status_code})')
                        
                        return Response({
                            'order_id': order.id,
                            'old_status': old_status,
                            'new_status': order.status,
                            'cdek_status': {
                                'code': cdek_status_code,
                                'name': cdek_status_name,
                                'date': status_date
                            },
                            'all_statuses': statuses
                        })
                    else:
                        return Response({'error': 'Статусы не найдены в ответе CDEK'}, status=400)
                else:
                    return Response({'error': 'Информация о заказе не найдена в ответе CDEK'}, status=400)
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
            except Exception as e:
                logger.error(f'Ошибка обновления статуса заказа: {str(e)}', exc_info=True)
                return Response({'error': f'Ошибка обновления статуса: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Транспортная компания не указана'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_order_documents(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
        
        if not order.external_order_uuid and not order.external_order_number:
            return Response({'error': 'Заказ не создан в CDEK'}, status=400)
        
        if order.transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter
            
            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)
                
                adapter = CDEKAdapter(
                    account=company.api_account,
                    secure_password=company.api_secure_password,
                    test_mode=False
                )
                
                documents = adapter.get_documents(
                    order_uuid=order.external_order_uuid,
                    cdek_number=order.external_order_number,
                    copy_count=2
                )
                
                if documents.get('success'):
                    return Response(documents)
                else:
                    return Response({'error': documents.get('error', 'Не удалось получить документы')}, status=500)
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
            except Exception as e:
                logger.error(f'Ошибка получения документов: {str(e)}', exc_info=True)
                return Response({'error': f'Ошибка получения документов: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Транспортная компания не указана'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=404)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_order_tracking(request, pk):
    try:
        order = Order.objects.get(pk=pk, user=request.user)
        
        if not order.external_order_uuid and not order.external_order_number:
            return Response({'error': 'Заказ не создан в CDEK'}, status=400)
        
        if order.transport_company_id:
            from apps.tariffs.models import TransportCompany
            from apps.tariffs.cdek_adapter import CDEKAdapter
            
            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)
                
                adapter = CDEKAdapter(
                    account=company.api_account,
                    secure_password=company.api_secure_password,
                    test_mode=False
                )
                
                order_info = adapter.get_order_info(
                    order_uuid=order.external_order_uuid,
                    cdek_number=order.external_order_number
                )
                
                tracking_history = []
                if 'entity' in order_info and 'statuses' in order_info['entity']:
                    statuses = order_info['entity']['statuses']
                    for status_item in statuses:
                        if status_item.get('code') != 'INVALID':
                            tracking_history.append({
                                'date_time': status_item.get('date_time', ''),
                                'status_code': status_item.get('code', ''),
                                'status_name': status_item.get('name', ''),
                                'city': status_item.get('city', ''),
                            })
                    
                    tracking_history.reverse()
                
                current_status = None
                if tracking_history:
                    current_status = tracking_history[0]
                
                return Response({
                    'order_id': order.id,
                    'cdek_number': order.external_order_number,
                    'current_status': current_status,
                    'tracking_history': tracking_history,
                })
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
            except Exception as e:
                logger.error(f'Ошибка получения трекинга: {str(e)}', exc_info=True)
                return Response({'error': f'Ошибка получения трекинга: {str(e)}'}, status=500)
        else:
            return Response({'error': 'Транспортная компания не указана'}, status=400)
    except Order.DoesNotExist:
        return Response({'error': 'Заказ не найден'}, status=404)
