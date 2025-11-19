from django.core.management.base import BaseCommand
from apps.tariffs.models import TransportCompany, Tariff


class Command(BaseCommand):
    help = 'Создает тестовые транспортные компании и тарифы'

    def handle(self, *args, **options):
        tc1, created = TransportCompany.objects.get_or_create(
            code='boxberry',
            defaults={
                'name': 'BoxBerry',
                'api_url': 'https://api.boxberry.ru',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Создана ТК: {tc1.name}'))

        tc2, created = TransportCompany.objects.get_or_create(
            code='cdek',
            defaults={
                'name': 'СДЭК',
                'api_url': 'https://api.cdek.ru',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Создана ТК: {tc2.name}'))

        tc3, created = TransportCompany.objects.get_or_create(
            code='dhl',
            defaults={
                'name': 'DHL',
                'api_url': 'https://api.dhl.ru',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Создана ТК: {tc3.name}'))

        for tc in [tc1, tc2, tc3]:
            tariff, created = Tariff.objects.get_or_create(
                transport_company=tc,
                min_weight=0,
                max_weight=100,
                defaults={
                    'name': 'Стандартный тариф',
                    'base_price': 300.00,
                    'price_per_kg': 50.00,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Создан тариф для {tc.name}'))

        self.stdout.write(self.style.SUCCESS('Тестовые данные созданы!'))


