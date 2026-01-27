from django.db import migrations


def set_third_party_defaults(apps, schema_editor):
    AppSettings = apps.get_model('orders', 'AppSettings')
    settings, _ = AppSettings.objects.get_or_create(pk=1)
    if not settings.third_party_name:
        settings.third_party_name = 'КУДРЯВЦЕВ АЛЕКСЕЙ АЛЕКСЕЕВИЧ'
    if not settings.third_party_address:
        settings.third_party_address = '143085, Заречье (рабочий поселок), Одинцовский район, ЛУГОВАЯ, 6к1, 509'
    if not settings.third_party_phone:
        settings.third_party_phone = '+79277272680'
    if not settings.third_party_email:
        settings.third_party_email = 'info@pochtahub.ru'
    settings.save(update_fields=[
        'third_party_name',
        'third_party_address',
        'third_party_phone',
        'third_party_email',
    ])


def unset_third_party_defaults(apps, schema_editor):
    AppSettings = apps.get_model('orders', 'AppSettings')
    settings = AppSettings.objects.filter(pk=1).first()
    if not settings:
        return
    if settings.third_party_name == 'КУДРЯВЦЕВ АЛЕКСЕЙ АЛЕКСЕЕВИЧ':
        settings.third_party_name = ''
    if settings.third_party_address == '143085, Заречье (рабочий поселок), Одинцовский район, ЛУГОВАЯ, 6к1, 509':
        settings.third_party_address = ''
    if settings.third_party_phone == '+79277272680':
        settings.third_party_phone = ''
    if settings.third_party_email == 'info@pochtahub.ru':
        settings.third_party_email = ''
    settings.save(update_fields=[
        'third_party_name',
        'third_party_address',
        'third_party_phone',
        'third_party_email',
    ])


class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0015_appsettings_third_party_fields'),
    ]

    operations = [
        migrations.RunPython(set_third_party_defaults, unset_third_party_defaults),
    ]
