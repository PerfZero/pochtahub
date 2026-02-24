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
    event_id = models.CharField(
        max_length=64,
        unique=True,
        null=True,
        blank=True,
        verbose_name="Уникальный ID события",
    )
    anonymous_id = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="Анонимный ID",
    )
    session_id = models.CharField(
        max_length=64,
        null=True,
        blank=True,
        verbose_name="ID сессии",
    )
    event_type = models.CharField(max_length=64, choices=EVENT_TYPES, verbose_name="Тип события")
    source = models.CharField(max_length=32, default="business", verbose_name="Источник")
    path = models.CharField(max_length=255, blank=True, default="", verbose_name="Путь страницы")
    referrer = models.TextField(blank=True, default="", verbose_name="Referrer")
    utm_source = models.CharField(max_length=128, blank=True, default="", verbose_name="UTM source")
    utm_medium = models.CharField(max_length=128, blank=True, default="", verbose_name="UTM medium")
    utm_campaign = models.CharField(max_length=128, blank=True, default="", verbose_name="UTM campaign")
    utm_term = models.CharField(max_length=128, blank=True, default="", verbose_name="UTM term")
    utm_content = models.CharField(max_length=128, blank=True, default="", verbose_name="UTM content")
    user_agent = models.TextField(blank=True, default="", verbose_name="User agent")
    device = models.CharField(max_length=32, blank=True, default="", verbose_name="Тип устройства")
    viewport_width = models.PositiveIntegerField(null=True, blank=True, verbose_name="Ширина viewport")
    viewport_height = models.PositiveIntegerField(null=True, blank=True, verbose_name="Высота viewport")
    client_timestamp = models.DateTimeField(null=True, blank=True, verbose_name="Клиентское время")
    duration_ms = models.PositiveIntegerField(null=True, blank=True, verbose_name="Длительность, мс")
    error_code = models.CharField(max_length=64, blank=True, default="", verbose_name="Код ошибки")
    error_message = models.TextField(blank=True, default="", verbose_name="Сообщение ошибки")
    ip_hash = models.CharField(max_length=64, blank=True, default="", verbose_name="Хеш IP")
    ip_prefix = models.CharField(max_length=64, blank=True, default="", verbose_name="Префикс IP")
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
            models.Index(fields=["anonymous_id", "created_at"]),
            models.Index(fields=["session_id", "created_at"]),
            models.Index(fields=["ip_hash", "created_at"]),
            models.Index(fields=["ip_prefix", "created_at"]),
        ]

    def __str__(self):
        return f"{self.event_type} ({self.source})"
