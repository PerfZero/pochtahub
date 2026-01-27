from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0014_invitelink_sms_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='appsettings',
            name='third_party_name',
            field=models.CharField(blank=True, max_length=200, verbose_name='Третье лицо: ФИО/Компания'),
        ),
        migrations.AddField(
            model_name='appsettings',
            name='third_party_address',
            field=models.TextField(blank=True, verbose_name='Третье лицо: Адрес'),
        ),
        migrations.AddField(
            model_name='appsettings',
            name='third_party_phone',
            field=models.CharField(blank=True, max_length=20, verbose_name='Третье лицо: Телефон'),
        ),
        migrations.AddField(
            model_name='appsettings',
            name='third_party_email',
            field=models.EmailField(blank=True, max_length=254, verbose_name='Третье лицо: Email'),
        ),
        migrations.AddField(
            model_name='appsettings',
            name='third_party_tin',
            field=models.CharField(blank=True, max_length=20, verbose_name='Третье лицо: ИНН'),
        ),
    ]
