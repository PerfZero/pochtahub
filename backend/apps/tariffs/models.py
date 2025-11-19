from django.db import models


class TransportCompany(models.Model):
    API_TYPE_CHOICES = [
        ('internal', 'Внутренний расчет'),
        ('cdek', 'CDEK API'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Название')
    code = models.CharField(max_length=50, unique=True, verbose_name='Код')
    api_url = models.URLField(blank=True, null=True, verbose_name='API URL')
    api_type = models.CharField(max_length=20, choices=API_TYPE_CHOICES, default='internal', verbose_name='Тип интеграции')
    api_account = models.CharField(max_length=200, blank=True, null=True, verbose_name='API Account (CDEK)')
    api_secure_password = models.CharField(max_length=200, blank=True, null=True, verbose_name='API Secure Password (CDEK)')
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        db_table = 'transport_companies'
        verbose_name = 'Транспортная компания'
        verbose_name_plural = 'Транспортные компании'

    def __str__(self):
        return self.name


class Tariff(models.Model):
    transport_company = models.ForeignKey(TransportCompany, on_delete=models.CASCADE, related_name='tariffs', verbose_name='Транспортная компания')
    name = models.CharField(max_length=200, verbose_name='Название')
    min_weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Минимальный вес (кг)')
    max_weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Максимальный вес (кг)')
    base_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Базовая цена')
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Цена за кг')
    is_active = models.BooleanField(default=True, verbose_name='Активен')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        db_table = 'tariffs'
        verbose_name = 'Тариф'
        verbose_name_plural = 'Тарифы'

    def __str__(self):
        return f"{self.transport_company.name} - {self.name}"


