from django.contrib import admin
from .models import Order, OrderEvent


class OrderEventInline(admin.TabularInline):
    model = OrderEvent
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'price', 'transport_company_name', 'created_at')
    list_filter = ('status', 'created_at', 'transport_company_name')
    search_fields = ('id', 'user__username', 'sender_name', 'recipient_name')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [OrderEventInline]
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'status', 'price', 'transport_company_id', 'transport_company_name')
        }),
        ('Отправитель', {
            'fields': ('sender_name', 'sender_phone', 'sender_address', 'sender_city')
        }),
        ('Получатель', {
            'fields': ('recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city')
        }),
        ('Параметры груза', {
            'fields': ('weight', 'length', 'width', 'height')
        }),
        ('Даты', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(OrderEvent)
class OrderEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'event_type', 'created_at')
    list_filter = ('event_type', 'created_at')
    search_fields = ('order__id', 'description')
    readonly_fields = ('created_at',)
