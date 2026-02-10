from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.authentication import SessionAuthentication
from apps.auth.authentication import OptionalJWTAuthentication
from decouple import config
from openai import OpenAI
import base64
import json
import re
from .models import TransportCompany, Tariff
from .calculator import TariffCalculator
from .cdek_adapter import CDEKAdapter
from .serializers import TransportCompanySerializer, TariffSerializer, CalculatePriceSerializer, AnalyzeImageSerializer


class TransportCompanyListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = TransportCompany.objects.filter(is_active=True)
    serializer_class = TransportCompanySerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context


class CalculatePriceView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CalculatePriceSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        weight = float(serializer.validated_data['weight'])
        dimensions = {
            'length': float(serializer.validated_data.get('length', 0)),
            'width': float(serializer.validated_data.get('width', 0)),
            'height': float(serializer.validated_data.get('height', 0)),
        }
        transport_company_id = serializer.validated_data.get('transport_company_id')
        from_city = serializer.validated_data.get('from_city')
        to_city = serializer.validated_data.get('to_city')
        from_address = serializer.validated_data.get('from_address')
        to_address = serializer.validated_data.get('to_address')
        courier_pickup = serializer.validated_data.get('courier_pickup', False)
        courier_delivery = serializer.validated_data.get('courier_delivery', False)
        declared_value = serializer.validated_data.get('declared_value')

        results = TariffCalculator.calculate(
            weight,
            dimensions,
            transport_company_id,
            from_city=from_city,
            to_city=to_city,
            from_address=from_address,
            to_address=to_address,
            courier_pickup=courier_pickup,
            courier_delivery=courier_delivery,
            declared_value=float(declared_value) if declared_value else None
        )

        return Response({
            'weight': weight,
            'dimensions': dimensions,
            'options': results
        })


class AnalyzeImageView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = AnalyzeImageSerializer

    def post(self, request, *args, **kwargs):
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            image_file = serializer.validated_data['image']

            image_file.seek(0)
            image_data = image_file.read()
            image_base64 = base64.b64encode(image_data).decode('utf-8')

            image_type = 'jpeg'
            if hasattr(image_file, 'content_type') and image_file.content_type:
                if 'png' in image_file.content_type:
                    image_type = 'png'
                elif 'webp' in image_file.content_type:
                    image_type = 'webp'
                elif 'gif' in image_file.content_type:
                    image_type = 'gif'

            api_key = config('OPENAI_API_KEY', default='')
            if not api_key:
                return Response({'error': 'OpenAI API key not configured'}, status=500)

            import httpx
            http_client = httpx.Client(timeout=60.0)
            client = OpenAI(api_key=api_key, http_client=http_client)

            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a measurement assistant. Analyze the MAIN object in the foreground of the image and estimate its dimensions and value with high precision. Always respond with valid JSON only, even if the object is not a package."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze ONLY the main object in the FOREGROUND of this image. Ignore all background objects, other items, or anything not in the center/front of the photo. Focus on the single most prominent object (package, box, item, smartphone, etc.) that is clearly visible in the foreground.\n\nIMPORTANT for dimensions:\n- Length: longest horizontal dimension\n- Width: shorter horizontal dimension (perpendicular to length)\n- Height: vertical dimension (thickness/depth). For thin objects like smartphones, tablets, books - pay special attention to height/thickness. Even thin objects have measurable height (usually 0.5-2 cm for phones, 1-3 cm for tablets). Minimum height should be at least 0.5 cm for any solid object.\n- Weight: estimate in kilograms based on object type and size\n\nUse reference objects (hands, fingers, phones, coins, etc.) for scale if visible. Be precise with height measurements - even very thin objects have measurable thickness.\n\nEstimate the declared value in rubles (оценочная стоимость) for insurance purposes based on THIS MAIN OBJECT.\n\nReturn ONLY valid JSON: {\"object_count\": 1, \"object_names\": [\"name of main object\"], \"length\": number, \"width\": number, \"height\": number, \"weight\": number, \"declared_value\": number}. All numeric values must be numbers. Height must be at least 0.5 cm for any solid object. The declared_value should be a reasonable estimate of the main object's value in rubles for insurance calculation."
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/{image_type};base64,{image_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=800
            )

            if not response.choices or not response.choices[0].message:
                return Response({'error': 'Пустой ответ от OpenAI API'}, status=500)

            content = response.choices[0].message.content
            if not content:
                return Response({'error': 'Контент ответа пустой'}, status=500)

            content = content.strip()

            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"OpenAI response content: {content}")

            try:
                data = json.loads(content)

                def safe_float(value, default=0):
                    if value is None:
                        return default
                    try:
                        return float(value)
                    except (ValueError, TypeError):
                        return default

                def safe_int(value, default=0):
                    if value is None:
                        return default
                    try:
                        return int(value)
                    except (ValueError, TypeError):
                        return default

                length = safe_float(data.get('length'), 0)
                width = safe_float(data.get('width'), 0)
                height = safe_float(data.get('height'), 0)
                weight = safe_float(data.get('weight'), 0)
                object_count = safe_int(data.get('object_count'), 1)
                object_names = data.get('object_names', [])
                if not isinstance(object_names, list):
                    object_names = []
                declared_value = safe_float(data.get('declared_value'), 0)

                if height > 0 and height < 1:
                    height = 1.0
                    logger.info(f"Высота скорректирована до минимума 1 см (было меньше)")

                if length == 0 and width == 0 and height == 0 and weight == 0:
                    logger.warning(f"All values are zero. Raw response: {content}")

                return Response({
                    'length': max(0, length),
                    'width': max(0, width),
                    'height': max(1, height) if height > 0 else 0,
                    'weight': max(0, weight),
                    'object_count': object_count,
                    'object_names': object_names,
                    'declared_value': max(0, declared_value)
                })
            except json.JSONDecodeError:
                json_match = re.search(r'\{[^}]+\}', content)
                if json_match:
                    data = json.loads(json_match.group())

                    def safe_float(value, default=0):
                        if value is None:
                            return default
                        try:
                            return float(value)
                        except (ValueError, TypeError):
                            return default

                    def safe_int(value, default=0):
                        if value is None:
                            return default
                        try:
                            return int(value)
                        except (ValueError, TypeError):
                            return default

                    object_names = data.get('object_names', [])
                    if not isinstance(object_names, list):
                        object_names = []

                    height_value = safe_float(data.get('height'), 0)
                    if height_value > 0 and height_value < 1:
                        height_value = 1.0

                    return Response({
                        'length': max(0, safe_float(data.get('length'), 0)),
                        'width': max(0, safe_float(data.get('width'), 0)),
                        'height': max(1, height_value) if height_value > 0 else 0,
                        'weight': max(0, safe_float(data.get('weight'), 0)),
                        'object_count': safe_int(data.get('object_count'), 1),
                        'object_names': object_names,
                        'declared_value': max(0, safe_float(data.get('declared_value'), 0))
                    })
                else:
                    if 'package' in content.lower() and ('not' in content.lower() or 'no' in content.lower() or 'unable' in content.lower()):
                        return Response({
                            'length': 0,
                            'width': 0,
                            'height': 0,
                            'weight': 0,
                            'object_count': 0,
                            'object_names': [],
                            'declared_value': 0,
                            'warning': 'На изображении не обнаружена посылка. Пожалуйста, загрузите фото посылки или коробки.'
                        })
                    return Response({'error': f'Не удалось распознать данные из ответа. Ответ: {content}'}, status=500)

        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            return Response({'error': f'Ошибка анализа изображения: {str(e)}', 'trace': error_trace}, status=500)


class DeliveryPointsView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        city = request.query_params.get('city')
        city_code = request.query_params.get('city_code')
        transport_company_id = request.query_params.get('transport_company_id')
        size = int(request.query_params.get('size', 20))

        if not city and not city_code:
            return Response({'error': 'Необходимо указать city или city_code'}, status=400)

        if not transport_company_id:
            return Response({'error': 'Необходимо указать transport_company_id'}, status=400)

        if size > 100:
            size = 100

        try:
            company = TransportCompany.objects.get(id=transport_company_id)
            if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)

            adapter = CDEKAdapter(
                account=company.api_account,
                secure_password=company.api_secure_password,
                test_mode=False
            )

            city_code_int = int(city_code) if city_code else None

            if city and not city_code_int:
                city_code_int = adapter._get_city_code(city)

            request_size = size * 3 if city else size

            points = adapter.get_delivery_points(
                city_code=city_code_int,
                city=city,
                type='PVZ',
                size=request_size
            )

            if city and points:
                filtered_points = []
                city_lower = city.lower().strip()
                for point in points:
                    point_city = point.get('location', {}).get('city', '')
                    if point_city and city_lower in point_city.lower():
                        filtered_points.append(point)

                if filtered_points:
                    points = filtered_points[:size]
                else:
                    points = points[:size]

            for point in points:
                if 'work_time_list' in point and 'work_time' not in point:
                    work_time_list = point.get('work_time_list', [])
                    work_time = []
                    for day_info in work_time_list:
                        if 'time' in day_info:
                            work_time.append({
                                'day': day_info.get('day', 0),
                                'time': day_info.get('time', '')
                            })
                    point['work_time'] = work_time

            return Response({'points': points, 'total': len(points)})
        except TransportCompany.DoesNotExist:
            return Response({'error': 'Транспортная компания не найдена'}, status=404)
        except Exception as e:
            return Response({'error': f'Ошибка получения ПВЗ: {str(e)}'}, status=500)


class CdekWidgetServiceView(generics.GenericAPIView):
    """
    Service endpoint для виджета СДЭК 3.0
    Проксирует запросы к API СДЭК с авторизацией
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        import requests as http_requests
        import logging
        logger = logging.getLogger(__name__)

        # Виджет СДЭК 3.0 отправляет данные в определённом формате
        action = request.data.get('action')
        logger.info(f'CDEK Widget request: action={action}, data={request.data}')

        try:
            company = TransportCompany.objects.filter(
                api_type='cdek',
                is_active=True,
                api_account__isnull=False,
                api_secure_password__isnull=False
            ).first()

            if not company:
                return Response({'error': 'CDEK компания не настроена'}, status=400)

            adapter = CDEKAdapter(
                account=company.api_account,
                secure_password=company.api_secure_password,
                test_mode=False
            )

            token = adapter._get_token()
            if not token:
                return Response({'error': 'Не удалось получить токен СДЭК'}, status=500)

            headers = {
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            }

            base_url = adapter.api_url

            if action == 'offices' or action == 'getOffices':
                # Получение списка ПВЗ
                city_code = request.data.get('city_code') or request.data.get('cityCode')

                params = {'size': 500}
                if city_code:
                    params['city_code'] = city_code

                response = http_requests.get(
                    f'{base_url}/deliverypoints',
                    headers=headers,
                    params=params,
                    timeout=30
                )

                if response.status_code == 200:
                    data = response.json()
                    # Форматируем ответ для виджета - он ожидает массив офисов
                    # с определёнными полями
                    offices = []
                    for point in data if isinstance(data, list) else []:
                        office = {
                            'code': point.get('code', ''),
                            'name': point.get('name', ''),
                            'city_code': point.get('location', {}).get('city_code', 0),
                            'city': point.get('location', {}).get('city', ''),
                            'address': point.get('location', {}).get('address', ''),
                            'address_full': point.get('location', {}).get('address_full', ''),
                            'postal_code': point.get('location', {}).get('postal_code', ''),
                            'latitude': point.get('location', {}).get('latitude', 0),
                            'longitude': point.get('location', {}).get('longitude', 0),
                            'work_time': point.get('work_time', ''),
                            'phone': point.get('phones', [{}])[0].get('number', '') if point.get('phones') else '',
                            'type': point.get('type', 'PVZ'),
                            'owner_code': point.get('owner_code', 'cdek'),
                        }
                        offices.append(office)
                    logger.info(f'CDEK offices: returning {len(offices)} offices')
                    return Response(offices)
                else:
                    logger.error(f'CDEK offices error: {response.status_code} - {response.text}')
                    return Response([], status=200)  # Возвращаем пустой массив

            elif action == 'calculate' or action == 'calculateDelivery':
                # Расчёт стоимости доставки
                calc_data = {
                    'type': 1,
                    'currency': 1,
                    'lang': 'rus',
                    'from_location': request.data.get('from_location') or request.data.get('fromLocation', {}),
                    'to_location': request.data.get('to_location') or request.data.get('toLocation', {}),
                    'packages': request.data.get('packages', []),
                }

                tariff_code = request.data.get('tariff_code') or request.data.get('tariffCode')
                if tariff_code:
                    calc_data['tariff_code'] = tariff_code

                response = http_requests.post(
                    f'{base_url}/calculator/tarifflist',
                    headers=headers,
                    json=calc_data,
                    timeout=30
                )

                if response.status_code == 200:
                    return Response(response.json())
                else:
                    logger.error(f'CDEK calculate error: {response.text}')
                    return Response({'tariff_codes': []}, status=200)

            elif action == 'cities' or action == 'getCities':
                # Поиск городов
                city = request.data.get('city', '') or request.data.get('name', '')

                params = {'size': 50}
                if city:
                    params['city'] = city

                response = http_requests.get(
                    f'{base_url}/location/cities',
                    headers=headers,
                    params=params,
                    timeout=30
                )

                if response.status_code == 200:
                    return Response(response.json())
                else:
                    logger.error(f'CDEK cities error: {response.text}')
                    return Response([], status=200)

            else:
                logger.warning(f'Unknown CDEK widget action: {action}')
                return Response({'error': f'Unknown action: {action}'}, status=400)

        except Exception as e:
            logger.error(f'CDEK widget service error: {str(e)}', exc_info=True)
            return Response({'error': str(e)}, status=500)

    def get(self, request, *args, **kwargs):
        return Response({'status': 'ok', 'service': 'cdek-widget'})


class GetTariffsView(generics.GenericAPIView):
    authentication_classes = [SessionAuthentication, OptionalJWTAuthentication]
    permission_classes = [permissions.AllowAny]

    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'detail': 'Учетные данные не были предоставлены.'}, status=401)

        transport_company_id = request.query_params.get('transport_company_id')
        from_city = request.query_params.get('from_city')
        to_city = request.query_params.get('to_city')
        weight = request.query_params.get('weight', '1.0')
        api_account = request.query_params.get('api_account')
        api_secure_password = request.query_params.get('api_secure_password')

        if not from_city or not to_city:
            return Response({'error': 'Необходимо указать from_city и to_city'}, status=400)

        account = None
        password = None

        if transport_company_id:
            try:
                company = TransportCompany.objects.get(id=transport_company_id)
                if company.api_type != 'cdek' or not company.api_account or not company.api_secure_password:
                    return Response({'error': 'Компания не поддерживает CDEK API'}, status=400)
                account = company.api_account
                password = company.api_secure_password
            except TransportCompany.DoesNotExist:
                return Response({'error': 'Транспортная компания не найдена'}, status=404)
        elif api_account and api_secure_password:
            account = api_account
            password = api_secure_password
        else:
            return Response({'error': 'Необходимо указать transport_company_id или api_account и api_secure_password'}, status=400)

        try:
            adapter = CDEKAdapter(
                account=account,
                secure_password=password,
                test_mode=False
            )

            tariffs = adapter.calculate_price(
                from_city=from_city,
                to_city=to_city,
                weight=float(weight),
                length=10,
                width=10,
                height=10
            )

            seen_codes = set()
            tariff_list = []
            for tariff in tariffs:
                tariff_code = tariff.get('tariff_code')
                tariff_name = tariff.get('tariff_name', '')
                if tariff_code and tariff_code not in seen_codes:
                    seen_codes.add(tariff_code)
                    tariff_list.append({
                        'code': tariff_code,
                        'name': tariff_name
                    })

            return Response({'tariffs': tariff_list})
        except Exception as e:
            return Response({'error': f'Ошибка получения тарифов: {str(e)}'}, status=500)
