from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("orders", "0012_order_recipient_email_order_sender_email"),
    ]

    operations = [
        migrations.CreateModel(
            name="InviteLink",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("token", models.CharField(max_length=20, unique=True, verbose_name="Токен")),
                ("payload", models.JSONField(blank=True, default=dict, verbose_name="Данные")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")),
            ],
            options={
                "verbose_name": "Инвайт ссылка",
                "verbose_name_plural": "Инвайт ссылки",
                "db_table": "invite_links",
                "ordering": ["-created_at"],
            },
        ),
    ]
