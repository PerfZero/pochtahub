from django.contrib import admin
from django import forms
from .models import TransportCompany, Tariff
from .cdek_adapter import CDEKAdapter


class TransportCompanyAdminForm(forms.ModelForm):
    test_from_city = forms.CharField(
        required=False,
        label='Тестовый город отправления',
        help_text='Укажите город для загрузки списка тарифов (например: Москва)',
        widget=forms.TextInput(attrs={'placeholder': 'Москва'})
    )
    test_to_city = forms.CharField(
        required=False,
        label='Тестовый город назначения',
        help_text='Укажите город для загрузки списка тарифов (например: Санкт-Петербург)',
        widget=forms.TextInput(attrs={'placeholder': 'Санкт-Петербург'})
    )
    test_weight = forms.FloatField(
        required=False,
        label='Тестовый вес (кг)',
        help_text='Укажите вес для загрузки списка тарифов',
        initial=1.0,
        widget=forms.NumberInput(attrs={'step': '0.1', 'min': '0.1'})
    )
    default_tariff_code = forms.ChoiceField(
        required=False,
        label='Код тарифа CDEK',
        choices=[('', '---------')],
        help_text='Выберите тариф из списка (заполните тестовые города и вес, затем нажмите "Загрузить тарифы")'
    )
    
    class Meta:
        model = TransportCompany
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        instance = self.instance
        tariff_choices = [('', '---------')]
        
        if instance and instance.pk:
            if instance.api_type == 'cdek' and instance.api_account and instance.api_secure_password:
                test_from_city = self.data.get('test_from_city', '') or self.initial.get('test_from_city', '')
                test_to_city = self.data.get('test_to_city', '') or self.initial.get('test_to_city', '')
                test_weight = self.data.get('test_weight', '') or self.initial.get('test_weight', '')
                
                if test_from_city and test_to_city and test_weight:
                    try:
                        adapter = CDEKAdapter(
                            account=instance.api_account,
                            secure_password=instance.api_secure_password,
                            test_mode=False
                        )
                        tariffs = adapter.calculate_price(
                            from_city=test_from_city,
                            to_city=test_to_city,
                            weight=float(test_weight),
                            length=10,
                            width=10,
                            height=10
                        )
                        seen_codes = set()
                        for tariff in tariffs:
                            tariff_code = tariff.get('tariff_code')
                            tariff_name = tariff.get('tariff_name', '')
                            if tariff_code and tariff_code not in seen_codes:
                                seen_codes.add(tariff_code)
                                label = f"{tariff_code} - {tariff_name}"
                                tariff_choices.append((tariff_code, label))
                    except Exception as e:
                        tariff_choices.append(('', f'Ошибка загрузки тарифов: {str(e)}'))
                elif instance.default_tariff_code:
                    tariff_choices.append((instance.default_tariff_code, f"{instance.default_tariff_code} - {instance.default_tariff_name or 'Текущий тариф'}"))
        
        self.fields['default_tariff_code'].choices = tariff_choices
        
        if instance and instance.default_tariff_code:
            self.fields['default_tariff_code'].initial = str(instance.default_tariff_code)
    
    def clean_default_tariff_code(self):
        tariff_code = self.cleaned_data.get('default_tariff_code')
        if tariff_code:
            return int(tariff_code)
        return None
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        test_from_city = self.cleaned_data.get('test_from_city', '')
        test_to_city = self.cleaned_data.get('test_to_city', '')
        test_weight = self.cleaned_data.get('test_weight', '')
        tariff_code = self.cleaned_data.get('default_tariff_code')
        
        if tariff_code and instance.api_type == 'cdek' and instance.api_account and instance.api_secure_password:
            if test_from_city and test_to_city and test_weight:
                try:
                    adapter = CDEKAdapter(
                        account=instance.api_account,
                        secure_password=instance.api_secure_password,
                        test_mode=False
                    )
                    tariffs = adapter.calculate_price(
                        from_city=test_from_city,
                        to_city=test_to_city,
                        weight=float(test_weight),
                        length=10,
                        width=10,
                        height=10
                    )
                    for tariff in tariffs:
                        if tariff.get('tariff_code') == tariff_code:
                            instance.default_tariff_name = tariff.get('tariff_name', '')
                            break
                except Exception:
                    pass
        
        if commit:
            instance.save()
        return instance


@admin.register(TransportCompany)
class TransportCompanyAdmin(admin.ModelAdmin):
    form = TransportCompanyAdminForm
    list_display = ('name', 'code', 'api_type', 'default_tariff_code', 'default_tariff_name', 'logo', 'is_active', 'created_at')
    list_filter = ('api_type', 'is_active', 'created_at')
    search_fields = ('name', 'code')
    readonly_fields = ('created_at',)
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'code', 'logo', 'is_active')
        }),
        ('Интеграция API', {
            'fields': ('api_type', 'api_url', 'api_account', 'api_secure_password', 'api_developer_key'),
            'description': 'Developer Key нужен для работы от третьих лиц - позволяет указывать своего отправителя'
        }),
        ('Загрузка тарифов CDEK', {
            'fields': ('test_from_city', 'test_to_city', 'test_weight'),
            'description': 'Заполните эти поля и нажмите кнопку "Загрузить тарифы" ниже для загрузки списка тарифов'
        }),
        ('Тариф CDEK', {
            'fields': ('default_tariff_code', 'default_tariff_name'),
            'description': 'Выберите тариф из списка после загрузки. Только назначенный тариф будет использоваться для расчетов.'
        }),
        ('Дата создания', {
            'fields': ('created_at',)
        }),
    )
    
    class Media:
        js = ('admin/js/transport_company_admin.js',)
        css = {
            'all': ('admin/css/transport_company_admin.css',)
        }
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj and obj.pk:
            form.base_fields['test_from_city'].initial = 'Москва'
            form.base_fields['test_to_city'].initial = 'Санкт-Петербург'
            form.base_fields['test_weight'].initial = 1.0
        return form
    
    def changeform_view(self, request, object_id=None, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['show_tariff_button'] = True
        return super().changeform_view(request, object_id, form_url, extra_context)


@admin.register(Tariff)
class TariffAdmin(admin.ModelAdmin):
    list_display = ('name', 'transport_company', 'min_weight', 'max_weight', 'base_price', 'price_per_kg', 'is_active')
    list_filter = ('transport_company', 'is_active', 'created_at')
    search_fields = ('name', 'transport_company__name')
