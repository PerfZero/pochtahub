from django.db import models


class TransportCompany(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    api_url = models.URLField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transport_companies'
        verbose_name = 'Транспортная компания'
        verbose_name_plural = 'Транспортные компании'

    def __str__(self):
        return self.name


class Tariff(models.Model):
    transport_company = models.ForeignKey(TransportCompany, on_delete=models.CASCADE, related_name='tariffs')
    name = models.CharField(max_length=200)
    min_weight = models.DecimalField(max_digits=10, decimal_places=2)
    max_weight = models.DecimalField(max_digits=10, decimal_places=2)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    price_per_kg = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tariffs'
        verbose_name = 'Тариф'
        verbose_name_plural = 'Тарифы'

    def __str__(self):
        return f"{self.transport_company.name} - {self.name}"


