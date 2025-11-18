from .models import TransportCompany, Tariff


class TariffCalculator:
    @staticmethod
    def calculate(weight, dimensions, transport_company_id=None):
        if transport_company_id:
            companies = TransportCompany.objects.filter(id=transport_company_id, is_active=True)
        else:
            companies = TransportCompany.objects.filter(is_active=True)

        results = []
        for company in companies:
            tariffs = Tariff.objects.filter(
                transport_company=company,
                min_weight__lte=weight,
                max_weight__gte=weight,
                is_active=True
            ).order_by('base_price')

            if tariffs.exists():
                tariff = tariffs.first()
                total_price = float(tariff.base_price) + (float(weight) * float(tariff.price_per_kg))
                results.append({
                    'company_id': company.id,
                    'company_name': company.name,
                    'company_code': company.code,
                    'price': round(total_price, 2),
                    'tariff_name': tariff.name,
                })

        return sorted(results, key=lambda x: x['price'])
