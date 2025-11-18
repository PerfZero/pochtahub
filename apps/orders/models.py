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

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')

    sender_name = models.CharField(max_length=200)
    sender_phone = models.CharField(max_length=20)
    sender_address = models.TextField()
    sender_city = models.CharField(max_length=100)

    recipient_name = models.CharField(max_length=200)
    recipient_phone = models.CharField(max_length=20)
    recipient_address = models.TextField()
    recipient_city = models.CharField(max_length=100)

    weight = models.DecimalField(max_digits=10, decimal_places=2)
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    transport_company_id = models.IntegerField(null=True, blank=True)
    transport_company_name = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_events'
        verbose_name = 'Событие заказа'
        verbose_name_plural = 'События заказов'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order.id} - {self.get_event_type_display()}"
