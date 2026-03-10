from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("business", "0002_businessevent_anonymous_id_businessevent_device_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="businessevent",
            name="contact_phone",
            field=models.CharField(
                blank=True, default="", max_length=32, verbose_name="Контактный телефон"
            ),
        ),
        migrations.AlterField(
            model_name="businessevent",
            name="event_type",
            field=models.CharField(
                choices=[
                    ("business_page_view", "Просмотр business-страницы"),
                    ("business_login_success", "Успешный вход"),
                    ("business_photo_uploaded", "Загрузка фото"),
                    ("business_calc_success", "Успешный расчет"),
                    ("business_calc_error", "Ошибка расчета"),
                    ("business_copy_dimensions", "Копирование габаритов"),
                    ("business_share", "Поделиться результатом"),
                    ("abc_phone_submitted", "ABC: телефон оставлен"),
                ],
                max_length=64,
                verbose_name="Тип события",
            ),
        ),
    ]
