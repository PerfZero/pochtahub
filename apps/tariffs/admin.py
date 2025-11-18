from django.contrib import admin
from .models import TransportCompany, Tariff


@admin.register(TransportCompany)
class TransportCompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'code')


@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'transport_company', 'min_weight', 'max_weight', 'base_price', 'price_per_kg', 'is_active')
    list_filter = ('transport_company', 'is_active', 'created_at')
    search_fields = ('name', 'transport_company__name')
