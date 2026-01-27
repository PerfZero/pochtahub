import logging

from .models import OrderEvent, AppSettings
from apps.tariffs.cdek_adapter import CDEKAdapter
from apps.tariffs.models import TransportCompany


def create_cdek_order(order):
    logger = logging.getLogger(__name__)

    if order.external_order_uuid or order.external_order_number:
        logger.info('CDEK order already exists for order #%s', order.id)
        return

    transport_company_id = order.transport_company_id
    if not transport_company_id:
        return

    try:
        company = TransportCompany.objects.get(id=transport_company_id)
    except TransportCompany.DoesNotExist:
        return

    if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
        return

    user = order.user

    try:
        logger.info('Creating CDEK order for order #%s', order.id)

        adapter = CDEKAdapter(
            account=company.api_account,
            secure_password=company.api_secure_password,
            test_mode=False
        )

        from_code = adapter._get_city_code(order.sender_city)
        to_code = adapter._get_city_code(order.recipient_city)

        if not from_code:
            raise Exception(f'City "{order.sender_city}" not found in CDEK')
        if not to_code:
            raise Exception(f'City "{order.recipient_city}" not found in CDEK')

        recipient_delivery_point_code = getattr(order, 'recipient_delivery_point_code', None)
        tariff_code = order.tariff_code if hasattr(order, 'tariff_code') and order.tariff_code else None

        pvz_tariff_codes = [136, 137, 138, 139, 62, 63, 233, 234, 235, 236, 237, 238, 239, 240]

        if recipient_delivery_point_code and tariff_code and tariff_code not in pvz_tariff_codes:
            logger.warning('Tariff %s does not support PVZ, recalculating', tariff_code)
            tariff_code = None

        if not tariff_code:
            tariffs = adapter.calculate_price(
                from_city=order.sender_city,
                to_city=order.recipient_city,
                weight=float(order.weight),
                length=float(order.length) if order.length else None,
                width=float(order.width) if order.width else None,
                height=float(order.height) if order.height else None
            )
            if tariffs:
                if recipient_delivery_point_code:
                    pvz_tariffs = [t for t in tariffs if t.get('tariff_code') in pvz_tariff_codes]
                    if pvz_tariffs:
                        tariff_code = pvz_tariffs[0].get('tariff_code')
                        logger.info('Selected PVZ tariff: %s', tariff_code)
                    else:
                        logger.warning('No PVZ tariffs found, using first available')
                        tariff_code = tariffs[0].get('tariff_code')
                else:
                    tariff_code = tariffs[0].get('tariff_code')

        package_number = f"PKG-{order.id}"

        to_location = {
            'code': to_code,
            'address': order.recipient_address or order.recipient_city
        }

        delivery_point_value = None
        if recipient_delivery_point_code:
            if '-' in recipient_delivery_point_code:
                delivery_point_value = recipient_delivery_point_code
                logger.info('Using PVZ UUID: %s', delivery_point_value)
            else:
                try:
                    points = adapter.get_delivery_points(city=order.recipient_city, size=100)
                    point = next((p for p in points if p.get('code') == recipient_delivery_point_code), None)
                    if point and point.get('uuid'):
                        delivery_point_value = point.get('uuid')
                        logger.info('Found PVZ UUID: %s', delivery_point_value)
                    else:
                        delivery_point_value = recipient_delivery_point_code
                        logger.warning('PVZ code not found, using code as is')
                except Exception as e:
                    logger.error('PVZ lookup failed: %s, using code', str(e))
                    delivery_point_value = recipient_delivery_point_code

        items_data = {
            'name': 'Parcel',
            'ware_key': f'ITEM-{order.id}',
            'cost': float(order.price),
            'weight': int(float(order.weight) * 1000),
            'amount': 1,
            # Оплата уже выполнена на сайте, наложенный платеж не нужен
            'payment': {'value': 0.0}
        }

        sender_company = order.sender_company or (user.sender_company if user else None) or order.sender_name.strip()

        sender_data = {
            'name': order.sender_name.strip(),
            'company': sender_company,
            'phones': [{'number': order.sender_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}]
        }

        contragent_type = order.sender_contragent_type or (user.sender_contragent_type if user else None)
        if contragent_type:
            sender_data['contragent_type'] = contragent_type

        sender_tin = order.sender_tin or (user.sender_tin if user else None)
        if sender_tin:
            sender_data['tin'] = sender_tin

        seller_data = None
        app_settings = AppSettings.load()
        third_party_name = (app_settings.third_party_name or '').strip()
        third_party_phone = (app_settings.third_party_phone or '').strip()
        third_party_address = (app_settings.third_party_address or '').strip()
        third_party_tin = (app_settings.third_party_tin or '').strip()

        if third_party_name or third_party_tin:
            seller_data = {
                'name': third_party_name or order.sender_name.strip()
            }
            if third_party_tin:
                seller_data['inn'] = third_party_tin
            if third_party_phone:
                seller_data['phone'] = third_party_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
            if third_party_address:
                seller_data['address'] = third_party_address
        elif sender_company or sender_tin:
            seller_data = {
                'name': sender_company or order.sender_name.strip()
            }
            if sender_tin:
                seller_data['inn'] = sender_tin
            seller_data['phone'] = order.sender_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')
            seller_data['address'] = order.sender_address or order.sender_city

        order_data = {
            'type': 1,
            'number': str(order.id),
            'tariff_code': tariff_code or 136,
            'sender': sender_data,
            'recipient': {
                'name': order.recipient_name,
                'phones': [{'number': order.recipient_phone.replace(' ', '').replace('(', '').replace(')', '').replace('-', '')}]
            },
            'from_location': {
                'code': from_code,
                'address': order.sender_address or order.sender_city
            },
            'delivery_recipient_cost': {
                'value': 0.0
            },
            'packages': [{
                'number': str(order.id),
                'weight': int(float(order.weight) * 1000),
                'length': max(1, int(float(order.length))) if order.length and float(order.length) > 0 else (10 if float(order.weight) > 0.1 else 1),
                'width': max(1, int(float(order.width))) if order.width and float(order.width) > 0 else (10 if float(order.weight) > 0.1 else 1),
                'height': max(1, int(float(order.height))) if order.height and float(order.height) > 0 else (10 if float(order.weight) > 0.1 else 1),
                'comment': f'Parcel #{order.id}',
                'items': [items_data]
            }]
        }

        if delivery_point_value:
            order_data['delivery_point'] = delivery_point_value
        else:
            order_data['to_location'] = to_location

        if seller_data:
            order_data['seller'] = seller_data

        cdek_response = adapter.create_order(order_data)
        logger.info('CDEK order created: %s', cdek_response)

        if 'entity' in cdek_response and 'uuid' in cdek_response['entity']:
            order.external_order_uuid = cdek_response['entity']['uuid']
            if 'cdek_number' in cdek_response['entity']:
                order.external_order_number = cdek_response['entity'].get('cdek_number')
                logger.info('CDEK number received: %s', order.external_order_number)
            else:
                import time
                max_attempts = 5
                for attempt in range(1, max_attempts + 1):
                    time.sleep(2 * attempt)
                    try:
                        order_info = adapter.get_order_info(order_uuid=order.external_order_uuid)
                        logger.info('Attempt %s: CDEK order info received', attempt)
                        if 'entity' in order_info and 'cdek_number' in order_info['entity']:
                            cdek_number = order_info['entity'].get('cdek_number')
                            if cdek_number:
                                order.external_order_number = cdek_number
                                logger.info('CDEK number received: %s', order.external_order_number)
                                break
                        if attempt < max_attempts:
                            logger.info('CDEK number not yet assigned, attempt %s/%s', attempt, max_attempts)
                        else:
                            logger.warning('CDEK number not received after all attempts')
                    except Exception as e:
                        logger.warning('Attempt %s: failed to get CDEK number: %s', attempt, str(e))
                        if attempt < max_attempts:
                            continue
                        else:
                            logger.error('Failed to get CDEK number after %s attempts', max_attempts)

        has_errors = False
        error_messages = []
        if 'requests' in cdek_response:
            for req in cdek_response['requests']:
                if req.get('state') == 'INVALID' and req.get('errors'):
                    has_errors = True
                    for err in req.get('errors', []):
                        error_messages.append(f"{err.get('code')}: {err.get('message')}")

        if has_errors:
            logger.warning('CDEK order created with errors: %s', error_messages)
            order.status = 'cancelled'
            OrderEvent.objects.create(
                order=order,
                event_type='cancelled',
                description=f'Order created in CDEK with errors: {"; ".join(error_messages)}',
                metadata={'cdek_response': cdek_response, 'errors': error_messages}
            )
        else:
            if not delivery_point_value:
                try:
                    from datetime import datetime, timedelta
                    tomorrow = datetime.now() + timedelta(days=1)
                    courier_date = tomorrow.strftime('%Y-%m-%d')
                    courier_time_from = '10:00'
                    courier_time_to = '18:00'

                    courier_result = adapter._call_courier(
                        order_id=order.external_order_uuid,
                        courier_date=courier_date,
                        courier_time_from=courier_time_from,
                        courier_time_to=courier_time_to
                    )

                    if courier_result:
                        logger.info('Courier called for order %s', order.external_order_uuid)
                        OrderEvent.objects.create(
                            order=order,
                            event_type='shipped',
                            description=f'Order created in CDEK. UUID: {order.external_order_uuid}. Courier called {courier_date} {courier_time_from}-{courier_time_to}',
                            metadata={'cdek_response': cdek_response, 'courier_called': True, 'courier_date': courier_date}
                        )
                    else:
                        logger.warning('Failed to call courier for order %s', order.external_order_uuid)
                        OrderEvent.objects.create(
                            order=order,
                            event_type='shipped',
                            description=f'Order created in CDEK. UUID: {order.external_order_uuid}. Courier call failed',
                            metadata={'cdek_response': cdek_response, 'courier_called': False}
                        )
                except Exception as e:
                    logger.error('Courier call error: %s', str(e), exc_info=True)
                    OrderEvent.objects.create(
                        order=order,
                        event_type='shipped',
                        description=f'Order created in CDEK. UUID: {order.external_order_uuid}. Courier error: {str(e)}',
                        metadata={'cdek_response': cdek_response, 'courier_error': str(e)}
                    )
            else:
                logger.info('PVZ delivery, courier not required')
                OrderEvent.objects.create(
                    order=order,
                    event_type='shipped',
                    description=f'Order created in CDEK. UUID: {order.external_order_uuid}. PVZ: {delivery_point_value}',
                    metadata={'cdek_response': cdek_response, 'delivery_point': delivery_point_value}
                )

        order.save()
    except Exception as e:
        logger.error('CDEK order creation failed: %s', str(e), exc_info=True)
        OrderEvent.objects.create(
            order=order,
            event_type='created',
            description=f'CDEK order creation failed: {str(e)}',
            metadata={'error': str(e)}
        )
