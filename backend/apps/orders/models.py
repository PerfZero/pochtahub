from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Order(models.Model):
    STATUS_CHOICES = [
        ('new', 'Новый'),
        ('pending_payment', 'Ожидает оплаты'),
        ('paid', 'Оплачен'),
        ('in_delivery', 'В доставке'),
        ('completed', 'Завершен'),
        ('cancelled', 'Отменен'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders', verbose_name='Пользователь')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new', verbose_name='Статус')

    sender_name = models.CharField(max_length=200, verbose_name='Имя отправителя')
    sender_phone = models.CharField(max_length=20, verbose_name='Телефон отправителя')
    sender_address = models.TextField(verbose_name='Адрес отправителя')
    sender_city = models.CharField(max_length=100, verbose_name='Город отправителя')
    sender_company = models.CharField(max_length=200, blank=True, null=True, verbose_name='Название компании отправителя')
    sender_tin = models.CharField(max_length=20, blank=True, null=True, verbose_name='ИНН отправителя')
    sender_contragent_type = models.CharField(max_length=20, blank=True, null=True, choices=[('LEGAL_ENTITY', 'Юридическое лицо'), ('INDIVIDUAL', 'Физическое лицо')], verbose_name='Тип контрагента отправителя')

    recipient_name = models.CharField(max_length=200, verbose_name='Имя получателя')
    recipient_phone = models.CharField(max_length=20, verbose_name='Телефон получателя')
    recipient_address = models.TextField(verbose_name='Адрес получателя')
    recipient_city = models.CharField(max_length=100, verbose_name='Город получателя')
    recipient_delivery_point_code = models.CharField(max_length=50, blank=True, null=True, verbose_name='Код ПВЗ получателя')
    recipient_delivery_point_address = models.TextField(blank=True, null=True, verbose_name='Адрес ПВЗ получателя')

    weight = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Вес (кг)')
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Длина (см)')
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Ширина (см)')
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Высота (см)')
    package_image = models.ImageField(upload_to='package_images/', blank=True, null=True, verbose_name='Фото посылки')

    transport_company_id = models.IntegerField(null=True, blank=True, verbose_name='ID транспортной компании')
    transport_company_name = models.CharField(max_length=100, blank=True, verbose_name='Название транспортной компании')
    tariff_code = models.IntegerField(null=True, blank=True, verbose_name='Код тарифа (CDEK)')
    tariff_name = models.CharField(max_length=200, blank=True, verbose_name='Название тарифа')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    
    external_order_uuid = models.CharField(max_length=100, blank=True, null=True, verbose_name='UUID заказа во внешней системе')
    external_order_number = models.CharField(max_length=100, blank=True, null=True, verbose_name='Номер заказа во внешней системе')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        db_table = 'orders'
        verbose_name = 'Заказ'
        verbose_name_plural = 'Заказы'
        ordering = ['-created_at']

    def __str__(self):
        return f"Заказ #{self.id} - {self.user.username}"


class OrderEvent(models.Model):
    EVENT_TYPES = [
        ('created', 'Создан'),
        ('status_changed', 'Изменен статус'),
        ('payment_received', 'Получена оплата'),
        ('shipped', 'Отправлен'),
        ('delivered', 'Доставлен'),
        ('cancelled', 'Отменен'),
    ]

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='events', verbose_name='Заказ')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, verbose_name='Тип события')
    description = models.TextField(blank=True, verbose_name='Описание')
    metadata = models.JSONField(default=dict, blank=True, verbose_name='Метаданные')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')

    class Meta:
        db_table = 'order_events'
        verbose_name = 'Событие заказа'
        verbose_name_plural = 'События заказов'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order.id} - {self.get_event_type_display()}"
