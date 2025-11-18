from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Ожидает оплаты'),
        ('success', 'Успешно'),
        ('failed', 'Ошибка'),
    ]

    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='payments')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_id = models.CharField(max_length=100, unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        verbose_name = 'Платеж'
        verbose_name_plural = 'Платежи'
        ordering = ['-created_at']

    def __str__(self):
        return f"Платеж #{self.id} - {self.order.id}"
