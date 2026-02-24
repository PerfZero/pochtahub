from django.conf import settings
from django.db import models


class BusinessEvent(models.Model):
    EVENT_TYPES = [
        ("business_page_view", "Просмотр business-страницы"),
        ("business_login_success", "Успешный вход"),
        ("business_photo_uploaded", "Загрузка фото"),
        ("business_calc_success", "Успешный расчет"),
        ("business_calc_error", "Ошибка расчета"),
        ("business_copy_dimensions", "Копирование габаритов"),
        ("business_share", "Поделиться результатом"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="business_events",
        null=True,
        blank=True,
        verbose_name="Пользователь",
    )
    event_type = models.CharField(max_length=64, choices=EVENT_TYPES, verbose_name="Тип события")
    source = models.CharField(max_length=32, default="business", verbose_name="Источник")
    client_timestamp = models.DateTimeField(null=True, blank=True, verbose_name="Клиентское время")
    count_photos = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name="Количество фото")
    result = models.JSONField(default=dict, blank=True, verbose_name="Результат")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="Метаданные")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        db_table = "business_events"
        verbose_name = "Событие business"
        verbose_name_plural = "События business"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["event_type", "created_at"]),
            models.Index(fields=["source", "created_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"{self.event_type} ({self.source})"

