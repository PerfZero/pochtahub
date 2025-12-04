from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name='Телефон')
    sender_company = models.CharField(max_length=200, blank=True, null=True, verbose_name='Название компании отправителя')
    sender_tin = models.CharField(max_length=20, blank=True, null=True, verbose_name='ИНН отправителя')
    sender_contragent_type = models.CharField(max_length=20, blank=True, null=True, choices=[('LEGAL_ENTITY', 'Юридическое лицо'), ('INDIVIDUAL', 'Физическое лицо')], verbose_name='Тип контрагента отправителя')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата обновления')

    class Meta:
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
