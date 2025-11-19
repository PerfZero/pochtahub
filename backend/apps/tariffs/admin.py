from django.contrib import admin
from .models import TransportCompany, Tariff


@admin.register(TransportCompany)
class TransportCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'api_type', 'is_active', 'created_at')
    list_filter = ('api_type', 'is_active', 'created_at')
    search_fields = ('name', 'code')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'is_active')
        }),
        ('Интеграция API', {
            'fields': ('api_type', 'api_url', 'api_account', 'api_secure_password')
        }),
        ('Дата создания', {
            'fields': ('created_at',)
        }),
    )


@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'transport_company', 'min_weight', 'max_weight', 'base_price', 'price_per_kg', 'is_active')
    list_filter = ('transport_company', 'is_active', 'created_at')
    search_fields = ('name', 'transport_company__name')
