from .models import TransportCompany, Tariff
from .cdek_adapter import CDEKAdapter


class TariffCalculator:
    @staticmethod
    def calculate(weight, dimensions, transport_company_id=None, from_city=None, to_city=None, 
                 from_address=None, to_address=None, courier_pickup=False, courier_delivery=False):
        if transport_company_id:
            companies = TransportCompany.objects.filter(id=transport_company_id, is_active=True)
        else:
            companies = TransportCompany.objects.filter(is_active=True)

        results = []
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f'Начало расчета тарифов. Найдено компаний: {companies.count()}')
        
        for company in companies:
            logger.info(f'Обработка компании: {company.name} (ID: {company.id}, api_type: {company.api_type}, is_active: {company.is_active})')
            if company.api_type == 'cdek' and company.api_account and company.api_secure_password and from_city and to_city:
                logger.info(f'Вызов CDEK API для компании {company.name} (ID: {company.id})')
                logger.info(f'Параметры: from_city={from_city}, to_city={to_city}, weight={weight}, courier_pickup={courier_pickup}, courier_delivery={courier_delivery}')
                
                # Определяем тарифы CDEK в зависимости от типа доставки
                # 136 - склад-склад, 137 - склад-дверь, 138 - дверь-склад, 139 - дверь-дверь
                tariff_codes_to_check = []
                
                if courier_pickup and courier_delivery:
                    # Курьер забирает И привозит - дверь-дверь
                    tariff_codes_to_check = [139]
                elif courier_pickup and not courier_delivery:
                    # Курьер только забирает - дверь-склад
                    tariff_codes_to_check = [138]
                elif not courier_pickup and courier_delivery:
                    # Курьер только привозит - склад-дверь
                    tariff_codes_to_check = [137]
                else:
                    # Без курьера - склад-склад
                    tariff_codes_to_check = [136]
                
                logger.info(f'Выбранные тарифы для проверки: {tariff_codes_to_check} (courier_pickup={courier_pickup}, courier_delivery={courier_delivery})')
                
                try:
                    adapter = CDEKAdapter(
                        account=company.api_account,
                        secure_password=company.api_secure_password,
                        test_mode=False
                    )
                    logger.info(f'CDEK адаптер создан, API URL: {adapter.api_url}')
                    
                    # Пробуем получить тарифы для всех подходящих кодов
                    for tariff_code in tariff_codes_to_check:
                        try:
                            cdek_results = adapter.calculate_price(
                                from_city=from_city,
                                to_city=to_city,
                                weight=float(weight),
                                length=float(dimensions.get('length', 0)) if dimensions.get('length') else None,
                                width=float(dimensions.get('width', 0)) if dimensions.get('width') else None,
                                height=float(dimensions.get('height', 0)) if dimensions.get('height') else None,
                                tariff_code=tariff_code
                            )
                            logger.info(f'CDEK API вернул {len(cdek_results)} тарифов для кода {tariff_code}')
                            
                            if cdek_results:
                                for result in cdek_results:
                                    if not result.get('tariff_code'):
                                        result['tariff_code'] = tariff_code
                                    result['company_id'] = company.id
                                    result['company_code'] = company.code
                                    result['company_name'] = company.name
                                    if company.logo:
                                        result['company_logo'] = company.logo.url
                                    results.append(result)
                                # Если получили результат, прекращаем поиск
                                break
                        except Exception as e:
                            logger.warning(f'Ошибка расчета CDEK для тарифа {tariff_code}: {str(e)}')
                            continue
                    
                    if not any(r.get('company_id') == company.id for r in results):
                        logger.warning(f'CDEK API не вернул результатов ни для одного из тарифов: {tariff_codes_to_check}')
                except Exception as e:
                    logger.error(f'Ошибка расчета CDEK для компании {company.name}: {str(e)}', exc_info=True)
            
            tariffs = Tariff.objects.filter(
                transport_company=company,
                min_weight__lte=weight,
                max_weight__gte=weight,
                is_active=True
            )
            
            # Фильтруем тарифы по поддержке курьерской доставки
            if courier_pickup:
                tariffs = tariffs.filter(courier_pickup_supported=True)
            if courier_delivery:
                tariffs = tariffs.filter(courier_delivery_supported=True)
            
            tariffs = tariffs.order_by('base_price')

            logger.info(f'Найдено внутренних тарифов для компании {company.name}: {tariffs.count()}')
            
            if tariffs.exists():
                tariff = tariffs.first()
                total_price = float(tariff.base_price) + (float(weight) * float(tariff.price_per_kg))
                
                # Добавляем стоимость курьерской доставки
                if courier_pickup and tariff.courier_pickup_supported:
                    total_price += float(tariff.courier_pickup_price)
                if courier_delivery and tariff.courier_delivery_supported:
                    total_price += float(tariff.courier_delivery_price)
                
                result = {
                    'company_id': company.id,
                    'company_name': company.name,
                    'company_code': company.code,
                    'price': round(total_price, 2),
                    'tariff_name': tariff.name,
                }
                if company.logo:
                    result['company_logo'] = company.logo.url
                # Добавляем срок доставки из тарифа
                if tariff.delivery_days:
                    result['delivery_time'] = tariff.delivery_days
                elif tariff.delivery_days_min and tariff.delivery_days_max:
                    result['delivery_time_min'] = tariff.delivery_days_min
                    result['delivery_time_max'] = tariff.delivery_days_max
                logger.info(f'Добавлен внутренний тариф: {result}')
                results.append(result)

        logger.info(f'Всего результатов: {len(results)}')
        sorted_results = sorted(results, key=lambda x: x['price'])
        logger.info(f'Отсортированные результаты: {sorted_results}')
        return sorted_results
