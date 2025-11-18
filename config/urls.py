from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="PochtaHub API",
      default_version='v1',
      description="API для системы доставки",
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.auth.urls')),
    path('api/users/', include('apps.users.urls')),
    path('api/tariffs/', include('apps.tariffs.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/payment/', include('apps.payment.urls')),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]
