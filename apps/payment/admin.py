from django.contrib import admin
from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('id', 'order', 'user', 'amount', 'status', 'payment_id', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('payment_id', 'order__id', 'user__username')
    readonly_fields = ('created_at', 'updated_at')
