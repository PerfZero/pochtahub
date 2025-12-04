from .models import TransportCompany, Tariff
from .cdek_adapter import CDEKAdapter


class TariffCalculator:
    @staticmethod
    def calculate(weight, dimensions, transport_company_id=None, from_city=None, to_city=None, 
                 from_address=None, to_address=None):
        if transport_company_id:
            companies = TransportCompany.objects.filter(id=transport_company_id, is_active=True)
        else:
            companies = TransportCompany.objects.filter(is_active=True)

        results = []
        import logging
        logger = logging.getLogger(__name__)
        
        for company in companies:
            if company.api_type == 'cdek' and company.api_account and company.api_secure_password and from_city and to_city:
                logger.info(f'Вызов CDEK API для компании {company.name} (ID: {company.id})')
                logger.info(f'Параметры: from_city={from_city}, to_city={to_city}, weight={weight}')
                try:
                    adapter = CDEKAdapter(
                        account=company.api_account,
                        secure_password=company.api_secure_password,
                        test_mode=False
                    )
                    logger.info(f'CDEK адаптер создан, API URL: {adapter.api_url}')
                    cdek_results = adapter.calculate_price(
                        from_city=from_city,
                        to_city=to_city,
                        weight=float(weight),
                        length=float(dimensions.get('length', 0)) if dimensions.get('length') else None,
                        width=float(dimensions.get('width', 0)) if dimensions.get('width') else None,
                        height=float(dimensions.get('height', 0)) if dimensions.get('height') else None,
                        tariff_code=company.default_tariff_code
                    )
                    logger.info(f'CDEK API вернул {len(cdek_results)} тарифов')
                    
                    if company.default_tariff_code:
                        filtered_results = [r for r in cdek_results if r.get('tariff_code') == company.default_tariff_code]
                        if filtered_results:
                            cdek_results = filtered_results
                            logger.info(f'Отфильтровано по тарифу {company.default_tariff_code}: {len(cdek_results)} тарифов')
                        else:
                            logger.warning(f'Тариф {company.default_tariff_code} не найден в результатах CDEK')
                    
                    for result in cdek_results:
                        result['company_id'] = company.id
                        result['company_code'] = company.code
                        result['company_name'] = company.name
                        if company.default_tariff_name and not result.get('tariff_name'):
                            result['tariff_name'] = company.default_tariff_name
                        results.append(result)
                except Exception as e:
                    logger.error(f'Ошибка расчета CDEK для компании {company.name}: {str(e)}', exc_info=True)
            
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
