from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('success', 'Успешно'),
        ('failed', 'Ошибка'),
    ]

    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments', verbose_name='Заказ')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments', verbose_name='Пользователь')
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Сумма')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    payment_id = models.CharField(max_length=100, unique=True, blank=True, null=True, verbose_name='ID платежа')
    confirmation_url = models.URLField(blank=True, null=True, verbose_name='Ссылка на оплату')
    idempotence_key = models.CharField(max_length=64, blank=True, null=True, verbose_name='Idempotence ключ')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        db_table = 'payments'
        verbose_name = 'Платеж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']

    def __str__(self):
        return f"Платеж #{self.id} - {self.order.id}"
