from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Order, OrderEvent, AppSettings
from apps.tariffs.models import TransportCompany
from apps.tariffs.cdek_adapter import CDEKAdapter


class OrderEventInline(admin.TabularInline):
    model = OrderEvent
    extra = 0
    readonly_fields = ('created_at',)


class OrderAdminForm(forms.ModelForm):
    tariff_code = forms.ChoiceField(
        required=False,
        label='Код тарифа CDEK',
        choices=[('', '---------')],
        help_text='Выберите тариф CDEK из списка (заполните города и вес для загрузки тарифов)'
    )
    
    class Meta:
        model = Order
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        instance = self.instance
        tariff_choices = [('', '---------')]
        show_tariff_fields = False
        
        if instance and instance.transport_company_id:
            try:
                company = TransportCompany.objects.get(id=instance.transport_company_id)
                if company.api_type == 'cdek' and company.api_account and company.api_secure_password:
                    show_tariff_fields = True
                    if instance.sender_city and instance.recipient_city and instance.weight:
                        try:
                            adapter = CDEKAdapter(
                                account=company.api_account,
                                secure_password=company.api_secure_password,
                                test_mode=False
                            )
                            tariffs = adapter.calculate_price(
                                from_city=instance.sender_city,
                                to_city=instance.recipient_city,
                                weight=float(instance.weight),
                                length=float(instance.length) if instance.length else None,
                                width=float(instance.width) if instance.width else None,
                                height=float(instance.height) if instance.height else None
                            )
                            for tariff in tariffs:
                                tariff_code = tariff.get('tariff_code')
                                tariff_name = tariff.get('tariff_name', '')
                                price = tariff.get('price', 0)
                                if tariff_code:
                                    label = f"{tariff_code} - {tariff_name} ({price} руб.)"
                                    tariff_choices.append((tariff_code, label))
                        except Exception as e:
                            tariff_choices.append(('', f'Ошибка загрузки тарифов: {str(e)}'))
                    else:
                        self.fields['tariff_code'].help_text = 'Заполните города отправления/назначения и вес, затем сохраните заказ для загрузки тарифов'
            except TransportCompany.DoesNotExist:
                pass
        
        if not show_tariff_fields:
            self.fields['tariff_code'].help_text = 'Выберите транспортную компанию CDEK для загрузки тарифов'
        
        self.fields['tariff_code'].choices = tariff_choices
        
        if instance and instance.tariff_code:
            self.fields['tariff_code'].initial = str(instance.tariff_code)
    
    def clean_tariff_code(self):
        tariff_code = self.cleaned_data.get('tariff_code')
        if tariff_code:
            return int(tariff_code)
        return None
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        tariff_code = self.cleaned_data.get('tariff_code')
        if tariff_code and instance.transport_company_id:
            try:
                company = TransportCompany.objects.get(id=instance.transport_company_id)
                if company.api_type == 'cdek' and company.api_account and company.api_secure_password:
                    if instance.sender_city and instance.recipient_city and instance.weight:
                        try:
                            adapter = CDEKAdapter(
                                account=company.api_account,
                                secure_password=company.api_secure_password,
                                test_mode=False
                            )
                            tariffs = adapter.calculate_price(
                                from_city=instance.sender_city,
                                to_city=instance.recipient_city,
                                weight=float(instance.weight),
                                length=float(instance.length) if instance.length else None,
                                width=float(instance.width) if instance.width else None,
                                height=float(instance.height) if instance.height else None
                            )
                            for tariff in tariffs:
                                if tariff.get('tariff_code') == tariff_code:
                                    instance.tariff_name = tariff.get('tariff_name', '')
                                    break
                        except Exception:
                            pass
            except TransportCompany.DoesNotExist:
                pass
        if commit:
            instance.save()
        return instance


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    form = OrderAdminForm
    list_display = ('id', 'user', 'status', 'price', 'transport_company_name', 'tariff_name', 'external_order_number', 'created_at')
    list_filter = ('status', 'created_at', 'transport_company_name')
    search_fields = ('id', 'user__username', 'sender_name', 'recipient_name', 'external_order_uuid', 'external_order_number')
    readonly_fields = ('created_at', 'updated_at', 'package_image_preview')
    
    def package_image_preview(self, obj):
        if obj.package_image:
            return format_html(
                '<img src="{}" style="max-width: 300px; max-height: 300px;" />',
                obj.package_image.url
            )
        return 'Изображение не загружено'
    package_image_preview.short_description = 'Фото посылки'
    inlines = [OrderEventInline]
    actions = ['cancel_cdek_order']
    
    def cancel_cdek_order(self, request, queryset):
        from apps.tariffs.models import TransportCompany
        from apps.tariffs.cdek_adapter import CDEKAdapter
        import logging
        
        logger = logging.getLogger(__name__)
        cancelled = 0
        errors = 0
        skipped = 0
        
        for order in queryset:
            if not order.external_order_uuid:
                self.message_user(request, f'Заказ #{order.id} не имеет UUID заказа в CDEK', level='warning')
                skipped += 1
                continue
            
            try:
                company = TransportCompany.objects.get(id=order.transport_company_id)
                if company.api_type == 'cdek' and company.api_account and company.api_secure_password:
                    adapter = CDEKAdapter(
                        account=company.api_account,
                        secure_password=company.api_secure_password,
                        test_mode=False
                    )
                    
                    try:
                        order_info = adapter.get_order_info(order.external_order_uuid)
                        logger.info(f'Информация о заказе CDEK: {order_info}')
                        
                        entity_status = None
                        cdek_number = None
                        if 'entity' in order_info:
                            entity = order_info['entity']
                            entity_status = entity.get('status')
                            cdek_number = entity.get('cdek_number')
                        
                        status_info = f' (статус: {entity_status}, номер: {cdek_number})' if entity_status else ''
                        
                        if entity_status and entity_status in ['CANCELLED', 'DELIVERED', 'RECEIVED_AT_SHIPMENT_WAREHOUSE', 'ACCEPTED_AT_SHIPMENT_WAREHOUSE', 'ACCEPTED_AT_DESTINATION', 'ISSUED']:
                            self.message_user(request, f'Заказ #{order.id}{status_info} - отмена невозможна (заказ уже в обработке или доставке)', level='warning')
                            skipped += 1
                            continue
                        
                        if entity_status and entity_status not in ['ACCEPTED', 'CREATED', 'WAITING_FOR_PAYMENT']:
                            self.message_user(request, f'Заказ #{order.id}{status_info} - текущий статус не позволяет отмену', level='warning')
                            skipped += 1
                            continue
                    except Exception as e:
                        logger.warning(f'Не удалось получить информацию о заказе #{order.id}: {str(e)}')
                    
                    try:
                        adapter.delete_order(order.external_order_uuid)
                        order.status = 'cancelled'
                        order.save()
                        OrderEvent.objects.create(
                            order=order,
                            event_type='cancelled',
                            description=f'Заказ отменен в CDEK. UUID: {order.external_order_uuid}'
                        )
                        cancelled += 1
                    except Exception as e:
                        error_msg = str(e)
                        if 'Entity is invalid' in error_msg or 'v2_entity_invalid' in error_msg:
                            self.message_user(request, f'Заказ #{order.id} не может быть отменен (возможно, уже отменен или в процессе доставки). Попробуйте отменить вручную в личном кабинете CDEK.', level='warning')
                            skipped += 1
                        else:
                            raise
                else:
                    self.message_user(request, f'Заказ #{order.id} не связан с CDEK', level='warning')
                    skipped += 1
            except Exception as e:
                logger.error(f'Ошибка отмены заказа #{order.id} в CDEK: {str(e)}', exc_info=True)
                self.message_user(request, f'Ошибка отмены заказа #{order.id} в CDEK: {str(e)}', level='error')
                errors += 1
        
        if cancelled > 0:
            self.message_user(request, f'Отменено заказов в CDEK: {cancelled}', level='success')
        if skipped > 0:
            self.message_user(request, f'Пропущено заказов: {skipped}', level='warning')
        if errors > 0:
            self.message_user(request, f'Ошибок при отмене: {errors}', level='error')
    
    cancel_cdek_order.short_description = 'Отменить заказы в CDEK'
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'status', 'price', 'transport_company_id', 'transport_company_name', 'tariff_code', 'tariff_name')
        }),
        ('Внешняя система', {
            'fields': ('external_order_uuid', 'external_order_number'),
            'description': 'ID заказа во внешней системе (например, CDEK)'
        }),
        ('Отправитель', {
            'fields': ('sender_name', 'sender_phone', 'sender_address', 'sender_city')
        }),
        ('Получатель', {
            'fields': ('recipient_name', 'recipient_phone', 'recipient_address', 'recipient_city')
        }),
        ('Параметры груза', {
            'fields': ('weight', 'length', 'width', 'height', 'package_image', 'package_image_preview')
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


@admin.register(AppSettings)
class AppSettingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'packaging_price', 'pochtahub_commission', 'acquiring_percent', 'insurance_price', 'updated_at')
    
    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        # Создаем запись, если её нет
        AppSettings.load()
        return qs

    fieldsets = (
        ('Цены и комиссии', {
            'fields': ('packaging_price', 'pochtahub_commission', 'acquiring_percent', 'insurance_price'),
            'description': 'Настройте цены и комиссии для расчетов на странице оплаты'
        }),
        ('Системная информация', {
            'fields': ('updated_at',),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('updated_at',)
