from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0013_invitelink"),
    ]

    operations = [
        migrations.AddField(
            model_name="invitelink",
            name="sms_task_id",
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name="ID SMS"),
        ),
        migrations.AddField(
            model_name="invitelink",
            name="sms_status",
            field=models.CharField(blank=True, max_length=20, null=True, verbose_name="Статус SMS"),
        ),
    ]
