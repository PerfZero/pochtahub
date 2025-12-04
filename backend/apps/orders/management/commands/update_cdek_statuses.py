from django.core.management.base import BaseCommand
from apps.orders.models import Order, OrderEvent
from apps.tariffs.models import TransportCompany
from apps.tariffs.cdek_adapter import CDEKAdapter
import logging

logger = logging.getLogger(__name__)


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


class Command(BaseCommand):
    help = 'Обновляет статусы заказов из CDEK API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--order-id',
            type=int,
            help='Обновить статус конкретного заказа',
        )

    def handle(self, *args, **options):
        order_id = options.get('order_id')
        
        if order_id:
            orders = Order.objects.filter(id=order_id, external_order_uuid__isnull=False)
        else:
            orders = Order.objects.filter(
                external_order_uuid__isnull=False,
                status__in=['new', 'paid', 'in_delivery']
            )
        
        updated_count = 0
        error_count = 0
        
        for order in orders:
            try:
                if not order.transport_company_id:
                    continue
                
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    continue
                
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
                                }
                            )
                            
                            updated_count += 1
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Заказ #{order.id}: {old_status} -> {new_status} (CDEK: {cdek_status_code})'
                                )
                            )
                        else:
                            self.stdout.write(f'Заказ #{order.id}: статус не изменился ({old_status})')
                
                if 'entity' in order_info and 'cdek_number' in order_info['entity']:
                    cdek_number = order_info['entity'].get('cdek_number')
                    if cdek_number and not order.external_order_number:
                        order.external_order_number = cdek_number
                        order.save()
                        self.stdout.write(f'Заказ #{order.id}: получен номер CDEK {cdek_number}')
                        
            except TransportCompany.DoesNotExist:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Заказ #{order.id}: транспортная компания не найдена')
                )
            except Exception as e:
                error_count += 1
                logger.error(f'Ошибка обновления статуса заказа {order.id}: {str(e)}', exc_info=True)
                self.stdout.write(
                    self.style.ERROR(f'Заказ #{order.id}: ошибка - {str(e)}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nОбновлено: {updated_count}, Ошибок: {error_count}, Всего обработано: {orders.count()}'
            )
        )

