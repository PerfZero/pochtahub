from rest_framework import generics, permissions
from rest_framework.response import Response
from decouple import config
from openai import OpenAI
import base64
import json
import re
from .models import TransportCompany, Tariff
from .calculator import TariffCalculator
from .serializers import TransportCompanySerializer, TariffSerializer, CalculatePriceSerializer, AnalyzeImageSerializer


class TransportCompanyListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = TransportCompany.objects.filter(is_active=True)
    serializer_class = TransportCompanySerializer


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

        results = TariffCalculator.calculate(
            weight, 
            dimensions, 
            transport_company_id,
            from_city=from_city,
            to_city=to_city,
            from_address=from_address,
            to_address=to_address
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
                model="gpt-4-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a measurement assistant. Analyze any object in the image and estimate its dimensions. Always respond with valid JSON only, even if the object is not a package."
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "Analyze the main object in this image (package, box, item, etc.). Estimate dimensions in centimeters (length, width, height) and weight in kilograms. Use reference objects (hands, phones, etc.) for scale. If you see any box-like object, estimate its dimensions. Return ONLY valid JSON: {\"length\": number, \"width\": number, \"height\": number, \"weight\": number}. All values must be numbers. If you cannot determine a dimension, estimate based on visible objects."
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
                max_tokens=500
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
                
                length = safe_float(data.get('length'), 0)
                width = safe_float(data.get('width'), 0)
                height = safe_float(data.get('height'), 0)
                weight = safe_float(data.get('weight'), 0)
                
                if length == 0 and width == 0 and height == 0 and weight == 0:
                    logger.warning(f"All values are zero. Raw response: {content}")
                
                return Response({
                    'length': max(0, length),
                    'width': max(0, width),
                    'height': max(0, height),
                    'weight': max(0, weight)
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
                    
                    return Response({
                        'length': max(0, safe_float(data.get('length'), 0)),
                        'width': max(0, safe_float(data.get('width'), 0)),
                        'height': max(0, safe_float(data.get('height'), 0)),
                        'weight': max(0, safe_float(data.get('weight'), 0))
                    })
                else:
                    if 'package' in content.lower() and ('not' in content.lower() or 'no' in content.lower() or 'unable' in content.lower()):
                        return Response({
                            'length': 0,
                            'width': 0,
                            'height': 0,
                            'weight': 0,
                            'warning': 'На изображении не обнаружена посылка. Пожалуйста, загрузите фото посылки или коробки.'
                        })
                    return Response({'error': f'Не удалось распознать данные из ответа. Ответ: {content}'}, status=500)

        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            return Response({'error': f'Ошибка анализа изображения: {str(e)}', 'trace': error_trace}, status=500)
